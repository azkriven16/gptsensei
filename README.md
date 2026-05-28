# GPT Senpai

Manga, manhwa, manhua, and webtoon recommendation chat app with AniList search and Gemini-powered recommendations.

## Local Development

```bash
pnpm install
pnpm run dev
```

The local app runs on `http://localhost:3001` by default.

Create `.env.local`:

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3001"
```

## Cloudflare Pages

Build command:

```bash
pnpm run build
```

Build output directory:

```txt
dist
```

Set this environment variable in Cloudflare Pages:

```env
GEMINI_API_KEY
```

The `/api/chat` and `/api/recommend-similar` routes are implemented with Cloudflare Pages Functions under `functions/`.
