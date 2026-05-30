import { GoogleGenAI } from "@google/genai";

export interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_PROXY_URL?: string;
  GEMINI_PROXY_TOKEN?: string;
}

type GeminiProxyClient = {
  proxyUrl: string;
  token: string;
};

type GeminiClient = GoogleGenAI | GeminiProxyClient;

export const MODEL_FALLBACK_CHAIN = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
];

function describeGeminiError(error: any, modelName: string) {
  const message = String(error?.message || error || "");
  return `${modelName}: ${message}`;
}

export function getGeminiErrorMessage(error: any) {
  return String(error?.message || error || "");
}

export function getGeminiClient(env: Env) {
  if (env.GEMINI_PROXY_URL) {
    if (!env.GEMINI_PROXY_TOKEN) {
      throw new Error("GEMINI_PROXY_TOKEN environment variable is required when GEMINI_PROXY_URL is set.");
    }

    return {
      proxyUrl: env.GEMINI_PROXY_URL.replace(/\/$/, ""),
      token: env.GEMINI_PROXY_TOKEN,
    };
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }

  return new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "gpt-senpai-cloudflare-pages",
      },
    },
  });
}

function isProxyClient(ai: GeminiClient): ai is GeminiProxyClient {
  return "proxyUrl" in ai;
}

async function fetchProxy(ai: GeminiProxyClient, path: string, body?: unknown) {
  const response = await fetch(`${ai.proxyUrl}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Authorization": `Bearer ${ai.token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response;
}

export async function generateContentWithFallback(ai: GeminiClient, params: any) {
  const errors: string[] = [];

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      if (isProxyClient(ai)) {
        const response = await fetchProxy(ai, "/generate", {
          model: modelName,
          params,
        });

        return await response.json() as any;
      }

      return await ai.models.generateContent({
        ...params,
        model: modelName,
      });
    } catch (err: any) {
      errors.push(describeGeminiError(err, modelName));
      const errMsg = String(err.message || "").toLowerCase();
      if (errMsg.includes("api_key") || errMsg.includes("invalid") || errMsg.includes("key is required")) {
        throw err;
      }
    }
  }

  throw new Error(`All Gemini fallback models failed. ${errors.join(" | ")}`);
}

async function* proxyStream(response: Response) {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Gemini proxy stream response did not include a readable body.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const line = event.split("\n").find((part) => part.startsWith("data: "));
      const data = line?.slice(6).trim();

      if (!data) {
        continue;
      }

      if (data === "[DONE]") {
        return;
      }

      const payload = JSON.parse(data);

      if (payload.error) {
        throw new Error(payload.error);
      }

      yield payload;
    }
  }
}

export async function generateContentStreamWithFallback(ai: GeminiClient, params: any) {
  const errors: string[] = [];

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      if (isProxyClient(ai)) {
        const response = await fetchProxy(ai, "/stream", {
          model: modelName,
          params,
        });

        return proxyStream(response);
      }

      return await ai.models.generateContentStream({
        ...params,
        model: modelName,
      });
    } catch (err: any) {
      errors.push(describeGeminiError(err, modelName));
      const errMsg = String(err.message || "").toLowerCase();
      if (errMsg.includes("api_key") || errMsg.includes("invalid") || errMsg.includes("key is required")) {
        throw err;
      }
    }
  }

  throw new Error(`All Gemini fallback stream models failed. ${errors.join(" | ")}`);
}

export async function listGenerateContentModels(ai: GeminiClient) {
  if (isProxyClient(ai)) {
    const response = await fetchProxy(ai, "/health");
    const body = await response.json() as any;
    return body.models || [];
  }

  const pager = await ai.models.list();
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

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
