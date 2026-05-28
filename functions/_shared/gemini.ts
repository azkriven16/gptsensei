import { GoogleGenAI } from "@google/genai";

export interface Env {
  GEMINI_API_KEY?: string;
}

export const MODEL_FALLBACK_CHAIN = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export function getGeminiClient(env: Env) {
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

export async function generateContentWithFallback(ai: GoogleGenAI, params: any) {
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      return await ai.models.generateContent({
        ...params,
        model: modelName,
      });
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err.message || "").toLowerCase();
      if (errMsg.includes("api_key") || errMsg.includes("invalid") || errMsg.includes("key is required")) {
        throw err;
      }
    }
  }

  throw lastError;
}

export async function generateContentStreamWithFallback(ai: GoogleGenAI, params: any) {
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      return await ai.models.generateContentStream({
        ...params,
        model: modelName,
      });
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err.message || "").toLowerCase();
      if (errMsg.includes("api_key") || errMsg.includes("invalid") || errMsg.includes("key is required")) {
        throw err;
      }
    }
  }

  throw lastError;
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
