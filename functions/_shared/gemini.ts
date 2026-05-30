import { GoogleGenAI } from "@google/genai";

export interface Env {
  GEMINI_API_KEY?: string;
}

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
  const errors: string[] = [];

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
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

export async function generateContentStreamWithFallback(ai: GoogleGenAI, params: any) {
  const errors: string[] = [];

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
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

export async function listGenerateContentModels(ai: GoogleGenAI) {
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
