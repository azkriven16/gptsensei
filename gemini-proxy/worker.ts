import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_PROXY_TOKEN: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function isAuthorized(request: Request, env: Env) {
  const authHeader = request.headers.get("Authorization") || "";
  return authHeader === `Bearer ${env.GEMINI_PROXY_TOKEN}`;
}

function getClient(env: Env) {
  return new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "gpt-senpai-gemini-proxy",
      },
    },
  });
}

async function listModels(env: Env) {
  const pager = await getClient(env).models.list();
  const models: Array<{
    name: string;
    displayName?: string;
    supportedActions: string[];
  }> = [];

  for await (const model of pager as any) {
    const supportedActions = model.supportedActions || model.supportedMethods || [];

    if (supportedActions.includes("generateContent")) {
      models.push({
        name: model.name,
        displayName: model.displayName,
        supportedActions,
      });
    }
  }

  return models;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!isAuthorized(request, env)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return jsonResponse({
          ok: true,
          models: await listModels(env),
        });
      }

      if (request.method === "POST" && url.pathname === "/generate") {
        const { model, params } = await request.json() as any;
        const response = await getClient(env).models.generateContent({
          ...params,
          model,
        });

        return jsonResponse({
          text: response.text || "",
          candidates: response.candidates,
        });
      }

      if (request.method === "POST" && url.pathname === "/stream") {
        const { model, params } = await request.json() as any;
        const encoder = new TextEncoder();
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        const writeEvent = async (payload: unknown) => {
          await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        const streamResponse = async () => {
          try {
            const stream = await getClient(env).models.generateContentStream({
              ...params,
              model,
            });

            for await (const chunk of stream) {
              await writeEvent({
                text: chunk.text || "",
                candidates: chunk.candidates,
              });
            }

            await writer.write(encoder.encode("data: [DONE]\n\n"));
          } catch (error: any) {
            await writeEvent({
              error: String(error?.message || error || "Gemini proxy stream failed."),
            });
            await writer.write(encoder.encode("data: [DONE]\n\n"));
          } finally {
            await writer.close();
          }
        };

        void streamResponse();

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error: any) {
      return jsonResponse({
        error: String(error?.message || error || "Gemini proxy failed."),
      }, 500);
    }
  },
};
