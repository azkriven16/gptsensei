import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from .env.local");
  }

  const ai = new GoogleGenAI({ apiKey });
  const pager = await ai.models.list();

  for await (const model of pager as any) {
    const actions = model.supportedActions || [];
    if (actions.includes("generateContent")) {
      console.log(model.name);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
