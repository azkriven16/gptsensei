import {
  Env,
  generateContentWithFallback,
  getGeminiClient,
  jsonResponse,
} from "../_shared/gemini";

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { title, genres, format, chapters, description } = await request.json() as any;

    if (!title) {
      return jsonResponse({ error: "Missing required query parameters: title is required." }, 400);
    }

    const genresStr = genres && Array.isArray(genres) ? genres.join(", ") : "None specified";
    const formatStr = format || "Manga";
    const chaptersStr = chapters ? `${chapters} chapters` : "unknown chapters";
    const recommendationPersonaInstruction = "You are GPT Senpai, a concise manga, manhwa, manhua, and webtoon recommendation assistant. Recommend based on genuine similarity, reader mood, genre overlap, pacing, and premise fit. Be useful, direct, and honest about caveats.";

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

    const ai = getGeminiClient(env);
    const aiResponse = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: `${recommendationPersonaInstruction}
        Your response MUST be a JSON object containing a list of exactly 4 recommendations with specific keys:
        - title: Name of the similar manga/manhwa
        - chapters: Total chapters/status (example: "120+ chapters (Ongoing)" or "75 chapters (Completed)")
        - synopsis: 1-2 sentences absolute core premise
        - communitySays: 1-2 sentences summarizing general community acclaim/reviews
        - otakuPitch: Your personalized snappy pitch (1-2 sentences), convincing the user exactly why it is similar and why they should read it.`,
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
              },
            },
          },
          required: ["recommendations"],
        },
        temperature: 0.85,
      },
    });

    const responseText = aiResponse.text || "{}";
    return jsonResponse(JSON.parse(responseText));
  } catch (error: any) {
    return jsonResponse({
      error: error.message || "Failed to generate similar recommendations.",
    }, 500);
  }
};
