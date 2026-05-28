import {
  Env,
  generateContentStreamWithFallback,
  generateContentWithFallback,
  getGeminiClient,
  jsonResponse,
} from "../_shared/gemini";

const systemInstruction = `You are GPT Senpai, a manga, manhwa, manhua, and webtoon recommendation assistant.
Your job is to help readers find media that genuinely fits their taste, mood, tolerance, and current obsession.
Be warm, sharp, and concise. Avoid roleplay gimmicks, fake certainty, long intros, and generic hype.
When recommending media, provide exactly 4 recommendations unless the user explicitly asks for a different count.
For each recommendation, include the title, format/region if useful, genre or mood tags, a short premise, why it matches, and one honest caveat when relevant.
If the user's request is vague, infer a reasonable reading mood and mention the assumption briefly.`;

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
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
      },
    };

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const aiResponseStream = await generateContentStreamWithFallback(ai, params);
            const searchSources: any[] = [];

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

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                text,
                searchSources: searchSources.length > 0 ? searchSources : undefined,
              })}\n\n`));
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (error: any) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              error: error.message || "An internal error occurred during generation request.",
            })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally {
            controller.close();
          }
        },
      });

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
