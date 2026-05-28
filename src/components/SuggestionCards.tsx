/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BookOpen, Code, Compass, Lightbulb, RefreshCw, Shuffle } from 'lucide-react';

interface Suggestion {
  title: string;
  subtitle: string;
  prompt: string;
  icon: 'study' | 'code' | 'brainstorm' | 'write';
}

const SUGGESTION_POOL: Suggestion[] = [
  {
    title: "Top LitRPG System Manhwas",
    subtitle: "suggest me titles like 'Solo Leveling' featuring tower climbing",
    prompt: "Can you suggest some of the best high-impact LitRPG/System manhwas similar to Solo Leveling and Omniscient Reader, detailing their art styles and hype factor?",
    icon: "code"
  },
  {
    title: "Dark Seinen Masterpieces",
    subtitle: "looking for psychological thrillers or grim dark plots",
    prompt: "I want deep, dark, and highly psychological seinen manga recommendations. Something with the caliber of Monster, Berserk, or Oyasumi Punpun. Explain why they are top tier.",
    icon: "study"
  },
  {
    title: "Enemies to Lovers Otome",
    subtitle: "reincarnation, contract marriages, and doting leads",
    prompt: "Suggest some top-tier historical romance otome/villainess webtoons with high-tension enemies-to-lovers dynamics and charming, protective leads.",
    icon: "write"
  },
  {
    title: "Underrated Comfort Manga",
    subtitle: "cozy and heartwarming slice-of-life to heal the soul",
    prompt: "Recommend some lesser-known, clean, cozy, and super heartwarming slice-of-life manga that are perfect to read for relaxing. Describe their general vibes.",
    icon: "brainstorm"
  },
  {
    title: "Mind-Bending Thrillers",
    subtitle: "tense mysteries, death games, and elaborate traps",
    prompt: "Suggest some absolute page-turner physical/psychological thriller manga with complex games of wits, death matches, or brilliant mysteries (similar to Death Note, Liar Game, or Alice in Borderland).",
    icon: "code"
  },
  {
    title: "Classic Shonen Masterpieces",
    subtitle: "legendary anime candidates with outstanding execution",
    prompt: "What are some highly-rated shonen manga that every fan should read? Highlight ones with magnificent character growth, emotional peaks, and incredible world-building.",
    icon: "study"
  },
  {
    title: "Absurdist Comedy & Gags",
    subtitle: "uncontrollable laughter, parodies, and goofy plots",
    prompt: "Suggest some gold-standard comedy manga with hilarious gags, witty/bizarre characters, and absolute absurdism (like Grand Blue, Gintama, or Sakamoto Desu ga?).",
    icon: "brainstorm"
  },
  {
    title: "Gourmet & Culinary Journeys",
    subtitle: "mouth-watering illustrations and delicious stories",
    prompt: "Recommend gourmet or cooking-focused manga with incredible food art, fun cooking battles, or cozy restaurant-management scenarios.",
    icon: "write"
  },
  {
    title: "Dystopian Cyberpunk Sci-Fi",
    subtitle: "neon-lit futuristic worlds and synthetic lifespans",
    prompt: "Suggest some immersive sci-fi/cyberpunk manga examining artificial intelligence, bio-enhancements, and sprawling cityscapes in atmospheric detail.",
    icon: "code"
  },
  {
    title: "Heartfelt Coming-of-Age",
    subtitle: "nostalgic highs, deep friendships, and growing pain",
    prompt: "Could you recommend some emotional coming-of-age stories or slow-burn youth dramas that perfectly capture the transition from high school to adulthood?",
    icon: "study"
  },
  {
    title: "Modern Urban Fantasy",
    subtitle: "supernatural secrets buried inside modern cities",
    prompt: "Recommend urban fantasy manga options involving exorcists, modern wizards, or supernatural occurrences happening right under humanity's nose.",
    icon: "brainstorm"
  },
  {
    title: "Epic Historical Dramas",
    subtitle: "breathtaking period pieces loaded with custom lore",
    prompt: "I am looking for gorgeous historical fantasy, period action, or sweeping war strategy manga with detailed traditional armor, politics, and great scale (like Kingdom or Vinland Saga).",
    icon: "write"
  },
  {
    title: "Murim Rebirth & Sects",
    subtitle: "reincarnation of martial arts masters into weak bodies",
    prompt: "Suggest some high-impact Murim (martial arts) manhwa or manga focused on reincarnation, sect building, or deep master-disciple training (such as Return of the Mount Hua Sect, Nano Machine, or Breaker).",
    icon: "code"
  },
  {
    title: "Relentless Revenge Sagas",
    subtitle: "betrayed heroes returning to exact ruthless justice",
    prompt: "I want recommendations for raw, gripping revenge manga or manhwa where the main character undergoes deep betrayal and returns with terrifying strategic planning to systematically dismantle their targets.",
    icon: "study"
  },
  {
    title: "The Overpowered (OP) MC",
    subtitle: "insanely strong heroes hiding their true capabilities",
    prompt: "Recommend manga or manhwa featuring mind-bogglingly overpowered (OP) main characters who deliberately camouflage, suppress, or hide their cosmic real power until they surprise everyone.",
    icon: "brainstorm"
  },
  {
    title: "Tower Climbing & Floors",
    subtitle: "deadly tower tests with individual floor bio-zones",
    prompt: "Suggest top-tier tower-climbing manhwa where characters must overcome floor trials, coordinate raids on floor guardians, and deal with mysterious administrators to claim power.",
    icon: "write"
  },
  {
    title: "Regressor / Time Rewind",
    subtitle: "going back to the past with future guide knowledge",
    prompt: "What are some of the best high-strategy regressor manhwa or manga where the protagonist goes back in time and completely subverts fate using their knowledge of the future?",
    icon: "code"
  },
  {
    title: "Villainess Avoids Ruin",
    subtitle: "reincarnated as the villain of a dramatic noble novel",
    prompt: "Suggest some must-read Otome Isekai where the lead is reincarnated as a hated villainess and has to deploy smart, comedic maneuvers to avoid her fated execution or bad end.",
    icon: "write"
  },
  {
    title: "Monster Tamer & Bonding",
    subtitle: "summoning legendary beasts and tactical companion growth",
    prompt: "What are some highly engaging monster-taming or beast-summoning manga/manhwa with loyal beast companions, interesting evolutionary stages, and strong bonding mechanics?",
    icon: "brainstorm"
  },
  {
    title: "Guild Master & Shopkeep",
    subtitle: "managing a base, weapon shop, or guild of heroes",
    prompt: "Recommend manga or manhwa focusing on base building, managing a black-market items shop, or running a cozy magic apothecary for high-tier guild adventurers.",
    icon: "write"
  },
  {
    title: "Survival & Zombie Outbreaks",
    subtitle: "apocalypse base construction and team tactics",
    prompt: "What are some realistic survival-horror or zombie apocalypse manga/manhwa with smart, gritty team mechanics, raw panic, and extremely tense scavenging scenarios?",
    icon: "code"
  },
  {
    title: "High-Octane Sports Drama",
    subtitle: "underdog athletic teams shooting for legendary wins",
    prompt: "Recommend gripping sports manga with intense momentum, highly strategic games, and beautiful team dynamics (like Slam Dunk, Haikyuu!!, or Blue Lock).",
    icon: "study"
  },
  {
    title: "Gothic Vampire Romances",
    subtitle: "dark aristocrats, secret curses, and fated contracts",
    prompt: "Recommend dark, beautifully drawn gothic romances or vampire fantasy manga featuring ancient noble curses, blood covenants, and elegant supernatural aesthetics.",
    icon: "write"
  },
  {
    title: "Intellectual Geniuses",
    subtitle: "strategic mastermind games without physical combat",
    prompt: "Suggest high-IQ manga or manhwa starring tactical masterminds, financial geniuses, or brilliant politicians who win fights purely through intellect and psychological manipulation.",
    icon: "study"
  },
  {
    title: "Modern Dungeon Breakout",
    subtitle: "dungeon gates or portals tearing open in modern cities",
    prompt: "Recommend high-stake modern hunter manhwa featuring major dungeon breaks in metropolitan cities, hunter associations, and tactical raid coordination.",
    icon: "code"
  },
  {
    title: "Supernatural Ghost Bureaus",
    subtitle: "secret investigators cleansing cursed locations",
    prompt: "Recommend occult mystery/supernatural manga where special bureaus or secret exorcists investigate folklore anomalies, modern ghosts, and creepy urban legends.",
    icon: "brainstorm"
  },
  {
    title: "Warm Found-Family Tropes",
    subtitle: "fierce rulers softening up to protect adorable kids",
    prompt: "Suggest wholesome/funny fantasy manhwa centering on high-status parents or cold rulers learning how to raise an adorable, witty child while navigating royal schemes.",
    icon: "study"
  },
  {
    title: "Cybernetic Mecha Battles",
    subtitle: "piloting giant steel armor in post-apocalyptic zones",
    prompt: "Suggest some high-quality sci-fi mecha or combat-suit manga featuring heavy mechanical warfare, detailed pilot cockpit logistics, or apocalyptic ruined earths.",
    icon: "code"
  },
  {
    title: "Expert Medical Rebirth",
    subtitle: "applying modern medical ideas to medieval times",
    prompt: "Recommend fantasy or historical manhwa/manga where a modern expert surgeon or medical specialist reincarnates into a legacy world and performs genius life-saving operations.",
    icon: "study"
  },
  {
    title: "Cozy Farming & Planting",
    subtitle: "slow life agriculture using magical planting skills",
    prompt: "Suggest some cozy, highly satisfying slow-life farming or fantasy agriculture manga where the protagonist happily constructs a beautiful, lush countryside village or automated farm.",
    icon: "brainstorm"
  }
];

interface SuggestionCardsProps {
  onSelectSuggestion: (prompt: string) => void;
}

export default function SuggestionCards({ onSelectSuggestion }: SuggestionCardsProps) {
  const [randomizedSuggestions, setRandomizedSuggestions] = useState<Suggestion[]>([]);

  const shuffleSuggestions = () => {
    // Standard Fisher-Yates array shuffling to get 4 random unique suggestions
    const shuffled = [...SUGGESTION_POOL].sort(() => 0.5 - Math.random());
    setRandomizedSuggestions(shuffled.slice(0, 4));
  };

  useEffect(() => {
    shuffleSuggestions();
  }, []); // Runs once on mount

  const handleImFeelingLucky = () => {
    const randomPrompt = SUGGESTION_POOL[Math.floor(Math.random() * SUGGESTION_POOL.length)];
    onSelectSuggestion(randomPrompt.prompt);
  };
  
  const renderIcon = (type: string) => {
    const baseClass = "w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200";
    switch (type) {
      case "study":
        return <BookOpen className={`${baseClass} text-sky-400`} />;
      case "brainstorm":
        return <Lightbulb className={`${baseClass} text-amber-400`} />;
      case "code":
        return <Code className={`${baseClass} text-emerald-400`} />;
      case "write":
        return <Compass className={`${baseClass} text-purple-400`} />;
      default:
        return <Lightbulb className={`${baseClass} text-emerald-400`} />;
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-[720px] mx-auto w-full px-2 sm:px-4 font-sans">
      <div id="suggestion-cards-grid" className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
        {randomizedSuggestions.map((s, idx) => (
          <button
            key={s.title + idx}
            id={`suggestion-card-${idx}`}
            onClick={() => onSelectSuggestion(s.prompt)}
            className="group text-left p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#2f2f2f]/30 border border-white/5 hover:bg-[#2f2f2f]/60 hover:border-white/10 transition-colors duration-200 cursor-pointer flex flex-col justify-between h-auto min-h-[85px] sm:min-h-[110px] shadow-sm hover:shadow-md"
          >
            <div className="flex-grow min-w-0">
              <h4 className="text-[11px] sm:text-sm font-semibold text-white/95 font-sans tracking-wide leading-tight sm:leading-snug break-words line-clamp-2">
                {s.title}
              </h4>
              <p className="text-[9px] sm:text-[12px] text-white/40 font-normal leading-normal mt-0.5 sm:mt-1 line-clamp-2">
                {s.subtitle}
              </p>
            </div>
            <div className="flex justify-end mt-1.5 sm:mt-2.5">
              <div className="bg-[#171717]/40 group-hover:bg-[#171717]/80 p-1 sm:p-2 rounded-lg sm:rounded-xl transition-all border border-transparent group-hover:border-white/10">
                {renderIcon(s.icon)}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Suggestion Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
        <button
          onClick={shuffleSuggestions}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 hover:border-white/10 transition-all text-[11px] sm:text-xs font-semibold cursor-pointer select-none"
          title="Roll completely different topic prompts"
        >
          <RefreshCw className="w-3 h-3 text-[#10a37f]" />
          <span>Shuffle</span>
        </button>

        <button
          onClick={handleImFeelingLucky}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/10 to-rose-500/10 hover:from-amber-500/20 hover:to-rose-500/20 border border-amber-500/25 text-amber-300 hover:text-white transition-all text-[11px] sm:text-xs font-bold cursor-pointer select-none shadow-[0_0_15px_rgba(245,158,11,0.05)]"
          title="Picks one completely random question and submits it immediately"
        >
          <Shuffle className="w-3 h-3 text-amber-400" />
          <span>Lucky Roll</span>
        </button>
      </div>
    </div>
  );
}
