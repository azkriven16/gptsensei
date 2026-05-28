import { Env, MODEL_FALLBACK_CHAIN, jsonResponse } from "../_shared/gemini";

export const onRequestGet = ({ env }: { env: Env }) => {
  return jsonResponse({
    ok: true,
    hasGeminiKey: Boolean(env.GEMINI_API_KEY),
    geminiKeyLength: env.GEMINI_API_KEY ? env.GEMINI_API_KEY.length : 0,
    models: MODEL_FALLBACK_CHAIN,
    deployedAt: "2026-05-28T00:00:00Z",
  });
};
