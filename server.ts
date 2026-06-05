/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config({ path: ".env.local" });

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3001);

  // Set body parser with high limit to handle optional base64 image uploads comfortably
  app.use(express.json({ limit: "15mb" }));

  // Helper to lazily initialize the Gemini client so it does not crash on startup if the key is missing.
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Model Fallback chain helper to handle transient 503 limits dynamically
  const MODEL_FALLBACK_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
  ];

  async function generateContentWithFallback(ai: GoogleGenAI, params: any) {
    let lastError: any = null;
    for (const modelName of MODEL_FALLBACK_CHAIN) {
      try {
        console.log(`[Gemini Fallback] Attempting generation with model: ${modelName}`);
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        console.warn(`[Gemini Fallback] Model ${modelName} failed/busy:`, err.message || err);
        lastError = err;
        const errMsg = String(err.message || "").toLowerCase();
        if (errMsg.includes("api_key") || errMsg.includes("invalid") || errMsg.includes("key is required")) {
          throw err;
        }
      }
    }
    throw lastError;
  }

  async function generateContentStreamWithFallback(ai: GoogleGenAI, params: any) {
    let lastError: any = null;
    for (const modelName of MODEL_FALLBACK_CHAIN) {
      try {
        console.log(`[Gemini Fallback] Attempting stream with model: ${modelName}`);
        const stream = await ai.models.generateContentStream({
          ...params,
          model: modelName,
        });
        return stream;
      } catch (err: any) {
        console.warn(`[Gemini Fallback] Model stream ${modelName} failed/busy:`, err.message || err);
        lastError = err;
        const errMsg = String(err.message || "").toLowerCase();
        if (errMsg.includes("api_key") || errMsg.includes("invalid") || errMsg.includes("key is required")) {
          throw err;
        }
      }
    }
    throw lastError;
  }

  // Workers AI REST API streaming (used when CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_TOKEN are set in .env.local)
  async function* streamWorkersAI(
    accountId: string,
    token: string,
    messages: Array<{ role: string; content: string }>
  ) {
    console.log("[Workers AI] Streaming via REST API");
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stream: true, messages }),
      }
    );

    if (!response.ok) {
      throw new Error(`Workers AI error ${response.status}: ${await response.text()}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Workers AI response has no readable body.");
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const payload = JSON.parse(trimmed.slice(6));
            if (payload.response) yield payload.response as string;
          } catch {}
        }
      }
    }
  }

  // API entry points
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, webSearch, stream } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Missing required query parameters: messages array." });
        return;
      }

      const systemInstruction = `You are GPT Senpai, a manga, manhwa, manhua, and webtoon recommendation assistant.
Your job is to help readers find media that genuinely fits their taste, mood, tolerance, and current obsession.
Be warm, sharp, and concise. Avoid roleplay gimmicks, fake certainty, long intros, and generic hype.
When recommending media, provide exactly 4 recommendations unless the user explicitly asks for a different count.
IMPORTANT: Always format recommendations as a numbered list: 1. **Title** — each title must be a numbered item (1., 2., 3., 4.) with the title in bold (**Title**).
For each recommendation, include the title, format/region if useful, genre or mood tags, a short premise, why it matches, and one honest caveat when relevant.
If the user's request is vague, infer a reasonable reading mood and mention the assumption briefly.`;

      // Convert messages to Gemini's format: [{ role: 'user' | 'model', parts: [{ text: "..." }] }]
      const geminiContents = messages.map((m: any) => {
        const parts: any[] = [];

        // If message has inline base64 image payload attach it as standard multi-modal inline data
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
          parts: parts,
        };
      });

      // Assemble generative tools and configurations
      const tools: any[] = [];
      if (webSearch) {
        tools.push({ googleSearch: {} });
      }

      const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const cfAiToken = process.env.CLOUDFLARE_AI_TOKEN;
      const hasWorkersAI = Boolean(cfAccountId && cfAiToken);

      const geminiKey = process.env.GEMINI_API_KEY;
      const hasGemini = Boolean(geminiKey);

      // Helpers to detect quota/location errors worth falling back from
      const isGeminiFallbackable = (msg: string) =>
        msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand") ||
        msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("429") ||
        msg.includes("location") || msg.includes("failed_precondition") || msg.includes("rate");

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let usedFallback = false;

        if (hasGemini) {
          try {
            const ai = getGeminiClient();
            res.write(`data: ${JSON.stringify({ provider: "gemini" })}\n\n`);
            let aiResponseStream;
            try {
              aiResponseStream = await generateContentStreamWithFallback(ai, {
                contents: geminiContents,
                config: {
                  systemInstruction,
                  tools: tools.length > 0 ? tools : undefined,
                  temperature: 0.7,
                  thinkingConfig: { thinkingBudget: 0 },
                },
              });
            } catch (initErr: any) {
              if (hasWorkersAI && isGeminiFallbackable(String(initErr.message || "").toLowerCase())) {
                usedFallback = true;
              } else {
                res.write(`data: ${JSON.stringify({ error: initErr.message })}\n\n`);
                res.write("data: [DONE]\n\n");
                res.end();
                return;
              }
            }

            if (!usedFallback && aiResponseStream) {
              const searchSources: any[] = [];
              for await (const chunk of aiResponseStream) {
                const text = chunk.text || "";
                const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (chunks && Array.isArray(chunks)) {
                  chunks.forEach((c: any) => {
                    if (c.web && c.web.uri && c.web.title && !searchSources.some((s: any) => s.uri === c.web.uri)) {
                      searchSources.push({ title: c.web.title, uri: c.web.uri });
                    }
                  });
                }
                res.write(`data: ${JSON.stringify({ text, searchSources: searchSources.length > 0 ? searchSources : undefined })}\n\n`);
              }
              res.write("data: [DONE]\n\n");
              res.end();
              return;
            }
          } catch (geminiErr: any) {
            const lower = String(geminiErr.message || "").toLowerCase();
            if (hasWorkersAI && isGeminiFallbackable(lower)) {
              usedFallback = true;
            } else {
              res.write(`data: ${JSON.stringify({ error: geminiErr.message })}\n\n`);
              res.write("data: [DONE]\n\n");
              res.end();
              return;
            }
          }
        }

        if (hasWorkersAI && (!hasGemini || usedFallback)) {
          res.write(`data: ${JSON.stringify({ provider: "workers-ai" })}\n\n`);
          const aiMessages = [
            { role: "system", content: systemInstruction },
            ...geminiContents.map((m: any) => ({
              role: m.role === "model" ? "assistant" : "user",
              content: m.parts.map((p: any) => p.text || "").join(""),
            })),
          ];
          try {
            for await (const chunk of streamWorkersAI(cfAccountId!, cfAiToken!, aiMessages)) {
              res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
          } catch (err: any) {
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          }
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }

        res.write(`data: ${JSON.stringify({ error: "No AI backend is configured." })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      // Non-stream path — Gemini first, Workers AI fallback
      const ai = getGeminiClient();

      // Handle stream chat response if requested by client
      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let aiResponseStream;
        try {
          aiResponseStream = await generateContentStreamWithFallback(ai, {
            contents: geminiContents,
            config: {
              systemInstruction,
              tools: tools.length > 0 ? tools : undefined,
              temperature: 0.7,
              thinkingConfig: { thinkingBudget: 0 },
            },
          });
        } catch (streamInitErr: any) {
          const errMsg = streamInitErr.message || "All AI models are currently unavailable. Please try again later.";
          res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }

        const searchSources: any[] = [];
        for await (const chunk of aiResponseStream) {
          const text = chunk.text || "";
          
          // Extract web search grounding sources in stream mode
          const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks && Array.isArray(chunks)) {
            chunks.forEach((c: any) => {
              if (c.web && c.web.uri && c.web.title) {
                if (!searchSources.some((s: any) => s.uri === c.web.uri)) {
                  searchSources.push({
                    title: c.web.title,
                    uri: c.web.uri,
                  });
                }
              }
            });
          }

          res.write(`data: ${JSON.stringify({ text, searchSources: searchSources.length > 0 ? searchSources : undefined })}\n\n`);
        }

        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      
      // Query the fallback-backed Gemini generation
      const aiResponse = await generateContentWithFallback(ai, {
        contents: geminiContents,
        config: {
          systemInstruction,
          tools: tools.length > 0 ? tools : undefined,
          temperature: 0.7,
        },
      });

      // Extract generated text content
      const generatedText = aiResponse.text || "I was unable to synthesize a response at this time. Please try reframing your message.";

      // Extract search grounding citations if Google Search is enabled
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

      // Return compiled results
      res.json({
        content: generatedText,
        searchSources: searchSources.length > 0 ? searchSources : undefined,
      });

    } catch (error: any) {
      console.error("Gemini API server endpoint error:", error);
      res.status(500).json({
        error: error.message || "An internal error occurred during generation request.",
        isError: true,
      });
    }
  });

  // Specialized Similar Recommendations endpoint producing structured JSON
  app.post("/api/recommend-similar", async (req, res) => {
    try {
      const { title, genres, format, chapters, description } = req.body;

      if (!title) {
        res.status(400).json({ error: "Missing required query parameters: title is required." });
        return;
      }

      const genresStr = genres && Array.isArray(genres) ? genres.join(", ") : "None specified";
      const formatStr = format || "Manga";
      const chaptersStr = chapters ? `${chapters} chapters` : "unknown chapters";

      const recommendationPersonaInstruction = `You are GPT Senpai, a concise manga, manhwa, manhua, and webtoon recommendation assistant. Recommend based on genuine similarity, reader mood, genre overlap, pacing, and premise fit. Be useful, direct, and honest about caveats.`;

      const prompt = `
        A reader just finished reading (or reached the latest chapter of) "${title}".
        They are now bored and looking for exactly 4 highly similar manga or manhwa recommendations!
        Here is the info of the current manga they read:
        - Title: ${title}
        - Genres: ${genresStr}
        - Format: ${formatStr}
        - Chapters completed: ${chaptersStr}
        - Short description/premise: ${description || "Unknown"}

        Provide exactly 4 highly relevant similar manga or manhwa recommendations that will ease their boredom.
        Be extremely creative, highly accurate, and find genuine matches.
        
        CRITICAL: Follow your personality (${recommendationPersonaInstruction}) with custom pitches. But keep things short, snappy, and straight to the point! Avoid any long essays.
      `;

      const ai = getGeminiClient();

      const aiResponse = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: `${recommendationPersonaInstruction}
          Your response MUST be a JSON object containing a list of exactly 4 recommendations with specific keys:
          - title: Name of the similar manga/manhwa
          - chapters: Total chapters/status (example: "120+ chapters (Ongoing)" or "75 chapters (Completed)")
          - synopsis: 1-2 sentences absolute core premise
          - communitySays: 1-2 sentences summarizing general community acclaim/reviews
          - otakuPitch: Your personalized snappy pitch (1-2 sentences) in your active persona with fun emojis, convincing the user exactly why it is similar and why they MUST read it right now.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              recommendations: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    chapters: { type: "STRING" },
                    synopsis: { type: "STRING" },
                    communitySays: { type: "STRING" },
                    otakuPitch: { type: "STRING" },
                  },
                  required: ["title", "chapters", "synopsis", "communitySays", "otakuPitch"],
                }
              }
            },
            required: ["recommendations"]
          },
          temperature: 0.85,
        },
      });

      const responseText = aiResponse.text || "{}";
      const recommendationsData = JSON.parse(responseText);
      res.json(recommendationsData);

    } catch (error: any) {
      console.error("Gemini Similar recommendations error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate similar recommendations.",
      });
    }
  });

  // Serve static assets in production, hook Vite dev server in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GPTSenpai Clone Server] running successfully on port ${PORT}`);
  });
}

startServer();
