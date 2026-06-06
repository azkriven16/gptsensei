import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const ANILIST_QUERY = `
  query {
    Page(page: 1, perPage: 30) {
      media(type: ANIME, sort: POPULARITY_DESC, status_in: [RELEASING, FINISHED]) {
        id
        coverImage { extraLarge }
      }
    }
  }
`;

async function fetchAnimeCovers(): Promise<string[]> {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: ANILIST_QUERY }),
  });
  const json = await res.json();
  return (json?.data?.Page?.media ?? [])
    .map((m: { coverImage: { extraLarge: string } }) => m.coverImage.extraLarge)
    .filter(Boolean);
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [covers, setCovers] = useState<string[]>([]);

  useEffect(() => {
    fetchAnimeCovers().then(setCovers).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] font-sans flex flex-col">

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#212121]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#10a37f]" />
          <span className="font-bold text-white tracking-tight text-lg">GPT Senpai</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Hero with anime bg */}
      <section className="relative flex-grow flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">

        {/* Anime cover mosaic background */}
        {covers.length > 0 && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Scrolling columns */}
            <div className="absolute inset-0 flex gap-2 opacity-40">
              {[0, 1, 2, 3, 4].map((col) => {
                const slice = covers.slice(col * 6, col * 6 + 6);
                if (!slice.length) return null;
                return (
                  <div
                    key={col}
                    className="flex-1 flex flex-col gap-2"
                    style={{
                      transform: `translateY(${col % 2 === 0 ? '-8%' : '8%'})`,
                    }}
                  >
                    {[...slice, ...slice].map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="w-full object-cover rounded-lg"
                        style={{ aspectRatio: '3/4' }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
            {/* Gradient overlays so text stays readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#212121]/50 via-[#212121]/30 to-[#212121]/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#212121]/40 via-transparent to-[#212121]/40" />
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10a37f]/10 border border-[#10a37f]/20 text-[#10a37f] text-xs font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by Gemini
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl mb-6">
            Your AI guide for{' '}
            <span className="text-[#10a37f]">anime & manga</span>
          </h1>

          <p className="text-white/60 text-lg max-w-xl mb-10 leading-relaxed">
            Get honest reviews, chapter counts, and personalised recommendations for manga, manhwa, manhua, and anime — all in one chat.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#10a37f] hover:bg-[#0d8a6a] text-white font-semibold text-sm transition-colors shadow-lg shadow-[#10a37f]/20"
          >
            Start chatting free
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="mt-4 text-white/30 text-xs">No account required · Just ask your first question</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-5 text-center text-white/20 text-xs">
        © {new Date().getFullYear()} GPT Senpai · Built on Cloudflare Pages
      </footer>
    </div>
  );
}
