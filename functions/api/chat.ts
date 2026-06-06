import {
  Env,
  KVNamespace,
  generateContentStreamWithFallback,
  generateContentWithFallback,
  getGeminiClient,
  jsonResponse,
} from "../_shared/gemini";

const ANON_MESSAGE_LIMIT = 5;

function decodeJwtPayload(jwt: string): Record<string, any> | null {
  try {
    const payload = jwt.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

async function checkAnonLimit(
  kv: KVNamespace,
  userId: string,
): Promise<{ blocked: boolean; count: number }> {
  const count = parseInt((await kv.get(`anon:${userId}`)) || '0');
  return { blocked: count >= ANON_MESSAGE_LIMIT, count };
}

async function incrementAnonCount(kv: KVNamespace, userId: string): Promise<void> {
  const count = parseInt((await kv.get(`anon:${userId}`)) || '0');
  await kv.put(`anon:${userId}`, String(count + 1));
}

const systemInstruction = `You are GPT Senpai, a manga, manhwa, manhua, and webtoon recommendation assistant.
Your job is to help readers find media that genuinely fits their taste, mood, tolerance, and current obsession.
Be warm, sharp, and concise. Avoid roleplay gimmicks, fake certainty, long intros, and generic hype.
When recommending media, provide exactly 4 recommendations unless the user explicitly asks for a different count.
IMPORTANT: Always format recommendations as a numbered list: 1. **Title** — each title must be a numbered item (1., 2., 3., 4.) with the title in bold (**Title**).
For each recommendation, include the title, format/region if useful, genre or mood tags, a short premise, why it matches, and one honest caveat when relevant.
If the user's request is vague, infer a reasonable reading mood and mention the assumption briefly.`;

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    // Rate limit anonymous users
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const claims = token ? decodeJwtPayload(token) : null;
    const isAnon = claims?.is_anonymous === true;
    const userId: string | undefined = claims?.sub;

    if (isAnon && userId && env.RATE_LIMIT) {
      const { blocked, count } = await checkAnonLimit(env.RATE_LIMIT, userId);
      if (blocked) {
        return jsonResponse({
          error: `You've used all ${ANON_MESSAGE_LIMIT} free messages. Sign in with your email to keep chatting.`,
          limitReached: true,
          count,
          limit: ANON_MESSAGE_LIMIT,
        }, 429);
      }
      await incrementAnonCount(env.RATE_LIMIT, userId);
    }

    const { messages, webSearch, stream } = await request.json() as any;

    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: "Missing required query parameters: messages array." }, 400);
    }

    const geminiContents = messages.map((m: any) => {
      const parts: any[] = [];

      if (m.attachmentData && m.attachmentType && m.attachmentType.startsWith("image/")) {
        parts.push({
          inlineData: {
            mimeType: m.attachmentType,
            data: m.attachmentData,
          },
        });
      }

      parts.push({ text: m.content });

      return {
        role: m.role === "user" ? "user" : "model",
        parts,
      };
    });

    const tools: any[] = [];
    if (webSearch) {
      tools.push({ googleSearch: {} });
    }

    const ai = getGeminiClient(env);
    const params = {
      contents: geminiContents,
      config: {
        systemInstruction,
        tools: tools.length > 0 ? tools : undefined,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    if (stream) {
      const encoder = new TextEncoder();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      const writeEvent = async (payload: unknown) => {
        await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const streamResponse = async () => {
        try {
          const aiResponseStream = await generateContentStreamWithFallback(ai, params);
          const searchSources: any[] = [];
          let emittedText = false;

          for await (const chunk of aiResponseStream) {
            const text = chunk.text || "";
            const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;

            if (chunks && Array.isArray(chunks)) {
              chunks.forEach((c: any) => {
                if (c.web && c.web.uri && c.web.title && !searchSources.some((s: any) => s.uri === c.web.uri)) {
                  searchSources.push({
                    title: c.web.title,
                    uri: c.web.uri,
                  });
                }
              });
            }

            if (text) {
              emittedText = true;
            }

            await writeEvent({
              text,
              searchSources: searchSources.length > 0 ? searchSources : undefined,
            });
          }

          if (!emittedText) {
            await writeEvent({ warning: "Gemini stream completed without text." });
          }

          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } catch (error: any) {
          await writeEvent({
            error: error.message || "An internal error occurred during generation request.",
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

    const aiResponse = await generateContentWithFallback(ai, params);
    const generatedText = aiResponse.text || "I was unable to synthesize a response at this time. Please try reframing your message.";
    const searchSources: any[] = [];
    const chunks = aiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks && Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          searchSources.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
          });
        }
      });
    }

    return jsonResponse({
      content: generatedText,
      searchSources: searchSources.length > 0 ? searchSources : undefined,
    });
  } catch (error: any) {
    return jsonResponse({
      error: error.message || "An internal error occurred during generation request.",
      isError: true,
    }, 500);
  }
};
