import {
  Env,
  MODEL_FALLBACK_CHAIN,
  getGeminiClient,
  getGeminiErrorMessage,
  jsonResponse,
  listGenerateContentModels,
} from "../_shared/gemini";

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const cf = (request as any).cf || {};
  const body: any = {
    ok: true,
    checkedAt: new Date().toISOString(),
    hasGeminiKey: Boolean(env.GEMINI_API_KEY),
    geminiKeyLength: env.GEMINI_API_KEY ? env.GEMINI_API_KEY.length : 0,
    configuredModels: MODEL_FALLBACK_CHAIN,
    cloudflare: {
      colo: cf.colo,
      country: cf.country,
      region: cf.region,
      timezone: cf.timezone,
      placement: request.headers.get("cf-placement"),
    },
    geminiModelLookup: {
      ok: false,
      models: [],
      configuredModelAvailability: MODEL_FALLBACK_CHAIN.map((model) => ({
        model,
        available: false,
      })),
      error: env.GEMINI_API_KEY ? undefined : "GEMINI_API_KEY is missing.",
    },
  };

  if (!env.GEMINI_API_KEY) {
    return jsonResponse(body);
  }

  try {
    const ai = getGeminiClient(env);
    const models = await listGenerateContentModels(ai);
    const modelNames = new Set(models.flatMap((model) => [
      model.name,
      model.name.replace(/^models\//, ""),
    ]));

    body.geminiModelLookup = {
      ok: true,
      models,
      configuredModelAvailability: MODEL_FALLBACK_CHAIN.map((model) => ({
        model,
        available: modelNames.has(model),
      })),
    };
  } catch (error: any) {
    body.geminiModelLookup = {
      ...body.geminiModelLookup,
      error: getGeminiErrorMessage(error),
    };
  }

  return jsonResponse({
    ...body,
  });
};
