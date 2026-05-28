/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Flame, 
  Award, 
  Sparkles, 
  BookOpen, 
  X, 
  ExternalLink, 
  Star, 
  Bookmark, 
  RefreshCw,
  Send,
  MessageSquare,
  HelpCircle,
  Hash,
  SlidersHorizontal,
  Check,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  List
} from 'lucide-react';
import { getDisplayGenre } from '../utils/mediaLabels';

interface Title {
  english: string | null;
  romaji: string;
  userPreferred: string;
}

interface CoverImage {
  large: string;
  medium: string;
  color: string | null;
}

interface Manga {
  id: number;
  title: Title;
  type: string;
  format: string;
  status: string;
  chapters: number | null;
  volumes: number | null;
  description: string | null;
  coverImage: CoverImage;
  genres: string[];
  averageScore: number | null;
  popularity: number;
  siteUrl: string;
}

interface MangaExplorerProps {
  onAskAIAboutManga: (mangaTitle: string) => void;
  onClose?: () => void;
}

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 
  'Supernatural', 'Thriller', 'Slice of Life', 'Horror',
  'Sports', 'Mecha', 'Historical', 'Music'
];

const fetchAniListInfo = async (title: string) => {
  const query = `
    query ($search: String) {
      Media (search: $search, type: MANGA) {
        id
        coverImage {
          large
        }
        siteUrl
      }
    }
  `;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { search: title }
      })
    });
    if (res.ok) {
      const result = await res.json();
      return {
        coverImage: result.data?.Media?.coverImage?.large || null,
        siteUrl: result.data?.Media?.siteUrl || null
      };
    }
  } catch (err) {
    console.warn('Failed to fetch details for:', title, err);
  }
  return { coverImage: null, siteUrl: null };
};

function ExplorerMangaImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full bg-[#1c1c1c] overflow-hidden flex items-center justify-center">
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#121212] flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#10a37f]/30 animate-pulse" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#121212] flex flex-col items-center justify-center p-1 text-center">
          <BookOpen className="w-4 h-4 text-white/10" />
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          className={`w-full h-full object-cover transition-all duration-300 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}

export default function MangaExplorer({ onAskAIAboutManga, onClose }: MangaExplorerProps) {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>(() => {
    return localStorage.getItem('gptsenpai_anilist_layout') === 'list' ? 'list' : 'grid';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'TRENDING_DESC' | 'SCORE_DESC' | 'POPULARITY_DESC' | 'UPDATED_AT_DESC'>('TRENDING_DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);

  // Similar Recommendations state hook
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('gptsenpai_anilist_layout', layoutMode);
  }, [layoutMode]);

  // Flush recommendations when selected media shifts
  useEffect(() => {
    setRecommendations(null);
    setRecsLoading(false);
    setRecsError(null);
  }, [selectedManga]);

  const fetchSimilarRecommendations = async () => {
    if (!selectedManga) return;
    setRecsLoading(true);
    setRecsError(null);
    setRecommendations(null);

    const mTitle = selectedManga.title.english || selectedManga.title.romaji || selectedManga.title.userPreferred;

    try {
      const response = await fetch('/api/recommend-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: mTitle,
          genres: selectedManga.genres,
          format: selectedManga.format,
          chapters: selectedManga.chapters,
          description: selectedManga.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assemble customized similar recommendations.');
      }

      const data = await response.json();
      if (data && Array.isArray(data.recommendations)) {
        // Fetch custom covers & AniList siteUrls for each suggested masterpiece in parallel
        const enrichedRecs = await Promise.all(
          data.recommendations.map(async (rec: any) => {
            const aniInfo = await fetchAniListInfo(rec.title);
            return {
              ...rec,
              coverImage: aniInfo.coverImage,
              siteUrl: aniInfo.siteUrl,
            };
          })
        );
        setRecommendations(enrichedRecs);
      } else {
        throw new Error('Response formatting was invalid.');
      }
    } catch (err: any) {
      console.error(err);
      setRecsError(err.message || 'Failed to retrieve recommendation indices.');
    } finally {
      setRecsLoading(false);
    }
  };

  // Load popular trends on initial load or filters change
  useEffect(() => {
    fetchMangaData();
  }, [sortBy, selectedGenre, formatFilter, statusFilter]);

  const fetchMangaData = async (keyword: string = searchTerm) => {
    setLoading(true);
    setError(null);

    // AniList GraphQL query formulation supporting format and status
    const query = `
      query ($page: Int, $perPage: Int, $search: String, $genre: String, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) {
        Page (page: $page, perPage: $perPage) {
          media (search: $search, genre: $genre, format: $format, status: $status, type: MANGA, sort: $sort) {
            id
            title {
              english
              romaji
              userPreferred
            }
            type
            format
            status
            chapters
            volumes
            description
            coverImage {
              large
              medium
              color
            }
            genres
            averageScore
            popularity
            siteUrl
          }
        }
      }
    `;

    const variables: any = {
      page: 1,
      perPage: 12,
      sort: [sortBy],
    };

    if (keyword.trim()) {
      variables.search = keyword.trim();
    }
    if (selectedGenre) {
      variables.genre = selectedGenre;
    }
    if (formatFilter) {
      variables.format = formatFilter;
    }
    if (statusFilter) {
      variables.status = statusFilter;
    }

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.errors?.[0]?.message || 'Failed to retrieve database indices from AniList.');
      }

      setMangas(result.data?.Page?.media || []);
    } catch (err: any) {
      console.error('AniList fetch error:', err);
      setError(err.message || 'Service temporarily unavailable. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchMangaData();
    }
  };

  const formatDescription = (rawStr: string | null) => {
    if (!rawStr) return 'No synopsis recorded for this title in our indexes.';
    // Strip HTML tags safely to secure raw template matches
    return rawStr
      .replace(/<br>/gi, '\n')
      .replace(/<br\s*\/>/gi, '\n')
      .replace(/<i>/gi, '*')
      .replace(/<\/i>/gi, '*')
      .replace(/<b>/gi, '**')
      .replace(/<\/b>/gi, '**')
      .replace(/<[^>]*>/gi, ''); // catch leftovers
  };

  return (
    <div className="md:relative flex flex-col h-full bg-transparent text-gray-200 select-none font-sans overflow-hidden">
      
      {/* Search Header panel */}
      <div className="p-3.5 pb-2 bg-transparent flex-shrink-0">
        {onClose && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-[#10a37f]" />
              <h2 className="text-sm font-bold text-white tracking-wider">
                AniList Database Client
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-[#2f2f2f] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Real-time interactive Input fields */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search manga/manhwa/manhua..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full bg-[#2f2f2f]/50 border border-white/5 hover:border-white/10 focus:border-[#10a37f] rounded-xl pl-8.5 pr-8.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#10a37f]/50 transition-all font-sans"
            />
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400/80" />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  fetchMangaData('');
                }}
                className="absolute right-2.5 top-2.5 p-0.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="h-8 flex items-center rounded-xl bg-[#2b2b2b] border border-white/5 p-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                layoutMode === 'grid'
                  ? 'bg-[#10a37f]/15 text-[#10a37f]'
                  : 'text-white/35 hover:text-white hover:bg-white/5'
              }`}
              title="Poster grid layout"
            >
              <Grid2X2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('list')}
              className={`h-7 w-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                layoutMode === 'list'
                  ? 'bg-[#10a37f]/15 text-[#10a37f]'
                  : 'text-white/35 hover:text-white hover:bg-white/5'
              }`}
              title="List layout"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mihon/Tachiyomi-style Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider flex items-center gap-1 transition-all select-none cursor-pointer border h-8 ${
              showFilters || selectedGenre || formatFilter || statusFilter || sortBy !== 'TRENDING_DESC'
                ? 'bg-[#10a37f]/15 border-[#10a37f]/30 text-[#10a37f] hover:bg-[#10a37f]/25'
                : 'bg-[#2b2b2b] hover:bg-[#343434] border-white/5 text-gray-300'
            }`}
            title="Toggle advanced filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {(selectedGenre || formatFilter || statusFilter || sortBy !== 'TRENDING_DESC') && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-pulse" />
            )}
          </button>
        </div>

        {/* Tachiyomi/Mihon Collapsible Filter panel */}
        {showFilters && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowFilters(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="anilist-filter-title"
              className="w-full max-w-[560px] max-h-[86vh] bg-[#1f1f1f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-[#171717] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#10a37f]" />
                  <h3 id="anilist-filter-title" className="text-sm font-bold text-white/90 tracking-wide">
                    AniList Filters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 hover:bg-[#2f2f2f] text-white/40 hover:text-white rounded-lg transition cursor-pointer"
                  title="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {/* Sort By section */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-white/40 block">Sort By</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Trending', value: 'TRENDING_DESC' },
                  { label: 'Top Rated', value: 'SCORE_DESC' },
                  { label: 'Popular', value: 'POPULARITY_DESC' },
                  { label: 'Recently Updated', value: 'UPDATED_AT_DESC' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as any)}
                    className={`py-1 px-2 rounded-lg text-2xs font-semibold text-left flex items-center justify-between border transition cursor-pointer ${
                      sortBy === opt.value
                        ? 'bg-[#10a37f]/10 border-[#10a37f]/30 text-[#10a37f]'
                        : 'bg-[#262626] border-transparent hover:border-white/5 text-gray-300/80 hover:text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <Check className="w-3 h-3 text-[#10a37f]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-white/40 block">Format</span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: 'All', value: null },
                  { label: 'Manga', value: 'MANGA' },
                  { label: 'Novel', value: 'NOVEL' },
                  { label: 'OneShot', value: 'ONE_SHOT' }
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setFormatFilter(opt.value)}
                    className={`py-1 rounded-md text-[10px] font-bold transition cursor-pointer text-center truncate ${
                      formatFilter === opt.value
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 border'
                        : 'bg-[#262626] border border-transparent hover:border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-white/40 block">Status</span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: 'All', value: null },
                  { label: 'Ongoing', value: 'RELEASING' },
                  { label: 'Complete', value: 'FINISHED' },
                  { label: 'Hiatus', value: 'HIATUS' }
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`py-1 rounded-md text-[10px] font-bold transition cursor-pointer text-center truncate ${
                      statusFilter === opt.value
                        ? 'bg-[#10a37f]/15 border-[#10a37f]/30 text-[#10a37f] border'
                        : 'bg-[#262626] border border-transparent hover:border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres Section - Vertically Scrollable list to let users see them all! */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-white/40">Genres</span>
                {selectedGenre && (
                  <button
                    onClick={() => setSelectedGenre(null)}
                    className="text-[10px] text-rose-400/80 hover:text-rose-400 transition cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              
              {/* Vertically scrollable container containing ALL the genre tags */}
              <div className="max-h-[260px] overflow-y-auto border border-white/5 rounded-xl p-2 bg-black/25 grid grid-cols-2 gap-1.5 select-none scrollbar-thin">
                {GENRES.map((g) => {
                  const isSelected = selectedGenre === g;
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setSelectedGenre(isSelected ? null : g)}
                      className={`flex items-center justify-between py-1.5 px-2 text-[11px] rounded-lg transition cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-[#10a37f]/10 text-white font-semibold' 
                          : 'hover:bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>{getDisplayGenre(g)}</span>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${
                        isSelected 
                          ? 'bg-[#10a37f] border-[#10a37f]' 
                          : 'border-white/20'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="flex gap-2 pt-1 border-t border-white/5">
              <button
                onClick={() => {
                  setSelectedGenre(null);
                  setFormatFilter(null);
                  setStatusFilter(null);
                  setSortBy('TRENDING_DESC');
                  setSearchTerm('');
                  fetchMangaData('');
                }}
                className="flex-1 py-1.5 rounded-lg bg-[#2b2b2b] hover:bg-[#343434] text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-1.5 rounded-lg bg-[#10a37f] hover:bg-[#0d8a6a] text-xs font-semibold text-white transition cursor-pointer flex items-center justify-center gap-1 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
            </div>

              </div>
            </div>
          </div>
        )}

        {/* Dynamic active filter tags badges row (when filters are collapsed) */}
        {!showFilters && (selectedGenre || formatFilter || statusFilter || sortBy !== 'TRENDING_DESC') && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none flex-shrink-0">
            <span className="text-2xs text-gray-500 font-semibold tracking-wider">Active:</span>
            
            {sortBy !== 'TRENDING_DESC' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2b2b2b] text-2xs text-gray-300 border border-white/5 select-none whitespace-nowrap">
                <span>{sortBy === 'SCORE_DESC' ? '⭐ Rated' : sortBy === 'POPULARITY_DESC' ? '🔥 Popular' : sortBy === 'UPDATED_AT_DESC' ? '⏱️ Recent' : 'Trending'}</span>
                <button onClick={() => setSortBy('TRENDING_DESC')} className="hover:text-rose-400 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {selectedGenre && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10a37f]/15 text-[#10a37f] border border-[#10a37f]/30 text-2xs select-none whitespace-nowrap">
                <span>{getDisplayGenre(selectedGenre)}</span>
                <button onClick={() => setSelectedGenre(null)} className="hover:text-rose-400 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {formatFilter && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 text-2xs select-none whitespace-nowrap">
                <span>{formatFilter === 'NOVEL' ? 'Novel' : formatFilter === 'ONE_SHOT' ? 'One Shot' : 'Manga'}</span>
                <button onClick={() => setFormatFilter(null)} className="hover:text-rose-400 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {statusFilter && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-2xs select-none whitespace-nowrap">
                <span>{statusFilter === 'RELEASING' ? 'Ongoing' : statusFilter === 'FINISHED' ? 'Completed' : 'Hiatus'}</span>
                <button onClick={() => setStatusFilter(null)} className="hover:text-rose-400 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            <button
              onClick={() => {
                setSelectedGenre(null);
                setFormatFilter(null);
                setStatusFilter(null);
                setSortBy('TRENDING_DESC');
              }}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold tracking-wider px-1 py-0.5 whitespace-nowrap transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Grid content list */}
      <div className="flex-grow overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="space-y-3 pt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 bg-[#242424]/40 border border-white/5 rounded-xl p-2.5 animate-pulse">
                <div className="w-14 h-20 bg-white/5 rounded-lg flex-shrink-0" />
                <div className="flex-grow space-y-2 pt-1">
                  <div className="h-3.5 bg-white/15 rounded w-3/4" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                  <div className="h-4 bg-white/5 rounded w-5/6 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4 space-y-3">
            <HelpCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-xs text-rose-400 font-semibold">{error}</p>
            <button
              onClick={() => fetchMangaData()}
              className="px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3a3a3a] border border-white/5 rounded-lg text-2xs font-semibold cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : mangas.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-xs">
            <Bookmark className="w-8 h-8 text-white/10 mx-auto mb-2" />
            No indices found matching filters.
          </div>
        ) : (
          <div className={layoutMode === 'grid' ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1 gap-2.5'}>
            {mangas.map((manga) => {
              const displayTitle = manga.title.english || manga.title.romaji || manga.title.userPreferred;
              return (
                <div
                  key={manga.id}
                  onClick={() => setSelectedManga(manga)}
                  className={`group relative bg-[#262626]/40 hover:bg-[#262626]/85 border border-white/5 hover:border-white/10 p-2 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.2 min-w-0 ${
                    layoutMode === 'grid'
                      ? 'flex flex-col'
                      : 'flex gap-3 min-h-24'
                  }`}
                >
                  {/* High Quality Cover Image */}
                  <div className={`rounded-lg overflow-hidden bg-[#1f1f1f] flex-shrink-0 shadow-inner relative ${
                    layoutMode === 'grid' ? 'w-full aspect-[3/4]' : 'w-16 h-24'
                  }`}>
                    <img 
                      src={manga.coverImage.large} 
                      alt={displayTitle} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {manga.averageScore && (
                      <div className="absolute bottom-1 right-1 bg-black/85 text-[9px] font-bold text-amber-400 px-1 py-0.2 rounded flex items-center gap-0.5 shadow-sm border border-white/5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{manga.averageScore}</span>
                      </div>
                    )}
                  </div>

                  {/* Main descriptions */}
                  <div className={`flex-grow min-w-0 flex flex-col justify-between ${layoutMode === 'grid' ? 'pt-2' : 'pt-0.5'}`}>
                    <div>
                      <h4 className={`${layoutMode === 'grid' ? 'text-[11px] line-clamp-2' : 'text-xs line-clamp-2'} font-bold text-white group-hover:text-[#10a37f] leading-tight tracking-wide transition-colors`}>
                        {displayTitle}
                      </h4>
                      <div className="flex items-center gap-1 text-[9px] text-gray-400 font-medium mt-1 min-w-0">
                        <span className="text-amber-500/90 font-semibold">{manga.format}</span>
                        <span>•</span>
                        <span className="capitalize truncate">{manga.status.replace(/_/g, ' ').toLowerCase()}</span>
                      </div>
                      {layoutMode === 'list' && (
                        <p className="text-[10px] leading-snug text-white/35 line-clamp-2 mt-1.5">
                          {formatDescription(manga.description)}
                        </p>
                      )}
                    </div>

                    {/* Genres tag pill overlays */}
                    <div className={`flex flex-wrap gap-1 mt-1.5 overflow-hidden ${layoutMode === 'grid' ? 'h-[17px]' : 'max-h-[36px]'}`}>
                      {manga.genres.slice(0, 2).map((g) => (
                        <span key={g} className="text-[8px] bg-[#1a1a1a]/85 border border-white/5 px-1 py-0.2 rounded text-gray-400 font-normal truncate max-w-full">
                          {getDisplayGenre(g)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manga detailed Inspection Lightbox Dialog Modal */}
      {selectedManga && (
        <div 
          onClick={() => setSelectedManga(null)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end p-0 transition-opacity cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1e1e1e] border-t border-white/10 rounded-t-2xl max-h-[90%] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-5 cursor-default"
          >
            
            {/* Modal sticky actions bar */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#1a1a1a]">
              <span className="text-2xs font-bold text-[#10a37f] bg-[#10a37f]/15 px-2.5 py-1 rounded-full border border-[#10a37f]/25 tracking-wide">
                Indices Record #{selectedManga.id}
              </span>
              <button
                onClick={() => setSelectedManga(null)}
                className="p-1.5 hover:bg-[#2c2c2c] text-gray-400 hover:text-white rounded-lg transition"
                title="Dismiss modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable specs */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 font-sans">
              <div className="flex gap-4">
                {/* High quality thumbnail poster grid */}
                <div className="w-[110px] h-[160px] rounded-xl overflow-hidden shadow-lg bg-[#222] border border-white/5 flex-shrink-0 relative">
                  <ExplorerMangaImage
                    src={selectedManga.coverImage.large}
                    alt={selectedManga.title.english || selectedManga.title.romaji}
                  />
                </div>
                
                <div className="flex-grow space-y-2 pt-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight tracking-wide">
                    {selectedManga.title.english || selectedManga.title.romaji}
                  </h3>
                  {selectedManga.title.romaji && selectedManga.title.english && (
                    <p className="text-2xs text-gray-400 truncate font-medium">
                      Romaji: {selectedManga.title.romaji}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
                    <div className="text-gray-400">Chapters: <span className="text-white font-semibold">{selectedManga.chapters || 'TBA'}</span></div>
                    <div className="text-gray-400">Status: <span className="text-white capitalize font-semibold">{selectedManga.status.replace(/_/g, ' ').toLowerCase()}</span></div>
                    <div className="text-gray-400">Format: <span className="text-[#10a37f] font-bold">{selectedManga.format}</span></div>
                    <div className="text-gray-400 flex items-center gap-1">
                      Score: 
                      {selectedManga.averageScore ? (
                        <span className="text-amber-400 font-extrabold flex items-center gap-0.5">
                          ⭐ {selectedManga.averageScore}%
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Genre array listing */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-semibold text-gray-400 tracking-wider">Indexed Genres</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedManga.genres.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded bg-[#2b2b2b] text-[10px] text-gray-200 border border-white/5 font-semibold">
                      {getDisplayGenre(g)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Synopsis preview text */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-semibold text-gray-400 tracking-wider">Synopsis Premise</h5>
                <div className="p-3 bg-black/35 rounded-xl border border-white/5 max-h-[200px] overflow-y-auto">
                  <p className="text-[12.5px] leading-relaxed text-gray-300 font-normal whitespace-pre-line select-text">
                    {formatDescription(selectedManga.description)}
                  </p>
                </div>
              </div>

              {/* Similar Recommendations Section */}
              <div className="space-y-2.5 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">✨ Similar Masterpieces (AI Recommendation)</h5>
                  {recommendations && (
                    <button
                      onClick={fetchSimilarRecommendations}
                      className="text-[9px] text-[#10a37f] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Regenerate</span>
                    </button>
                  )}
                </div>

                {!recommendations && !recsLoading && !recsError && (
                  <button
                    onClick={fetchSimilarRecommendations}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#10a37f]/10 hover:bg-[#10a37f]/15 border border-[#10a37f]/30 text-xs text-[#10a37f] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Find Similar & See What People Say</span>
                  </button>
                )}

                {recsLoading && (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2 animate-pulse flex gap-3">
                        <div className="w-16 h-24 bg-white/5 rounded-lg flex-shrink-0 animate-pulse" />
                        <div className="flex-grow min-w-0 flex flex-col justify-between py-1">
                          <div className="space-y-2">
                            <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse" />
                            <div className="h-2 bg-white/5 rounded w-5/6 animate-pulse" />
                            <div className="h-2 bg-white/5 rounded w-2/3 animate-pulse" />
                          </div>
                          <div className="h-2 bg-[#10a37f]/10 rounded w-1/3 animate-pulse" />
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-500 text-center animate-pulse mt-2">
                      Consulting recommendations registry... 🔍
                    </p>
                  </div>
                )}

                {recsError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-1">
                    <p className="text-2xs text-rose-400 font-medium">{recsError}</p>
                    <button
                      onClick={fetchSimilarRecommendations}
                      className="text-2xs text-white hover:underline font-bold"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {recommendations && (
                  <div className="space-y-3">
                    {recommendations.map((rec, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-black/25 border border-white/5 rounded-xl flex gap-3 relative group hover:border-white/10 transition"
                      >
                        {rec.coverImage ? (
                          <div className="w-16 h-24 rounded-lg overflow-hidden bg-[#1f1f1f] border border-white/10 flex-shrink-0 shadow-md relative mt-0.5">
                            <ExplorerMangaImage 
                              src={rec.coverImage} 
                              alt={rec.title} 
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-[#2a2a2a] to-[#121212] border border-white/10 flex-shrink-0 shadow-md relative mt-0.5 flex flex-col items-center justify-center p-2 text-center select-none">
                            <BookOpen className="w-5 h-5 text-[#10a37f] mb-1.5 opacity-80" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none truncate w-full">
                              No Cover
                            </span>
                          </div>
                        )}
                        <div className="flex-grow min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h6 className="text-xs font-bold text-white leading-snug truncate group-hover:text-[#10a37f] transition-colors">
                                  {rec.title}
                                </h6>
                                {rec.siteUrl && (
                                  <a 
                                    href={rec.siteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-gray-400 hover:text-white transition p-0.5 flex-shrink-0"
                                    title="View on AniList"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2b2b2b] text-[#10a37f] font-semibold whitespace-nowrap border border-white/5 flex-shrink-0">
                                {rec.chapters}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-[11px] leading-relaxed">
                              <p className="text-gray-300">
                                <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wider block mb-0.5">Synopsis</span>
                                {rec.synopsis}
                              </p>
                              <p className="text-gray-400 border-l border-white/10 pl-2 mt-1 italic">
                                <span className="text-white/40 text-[9px] font-semibold uppercase tracking-wider block not-italic font-sans mb-0.5">What people say</span>
                                "{rec.communitySays}"
                              </p>
                            </div>
                          </div>

                          {/* Custom Pitch and CTA option */}
                          <div className="p-2.5 bg-[#1d1d1d] border border-white/5 rounded-lg mt-2.5 space-y-2">
                            <p className="text-[11px] text-gray-200 leading-snug">
                              <span className="text-amber-400 text-[9px] font-bold uppercase tracking-wide block mb-0.5">⚡ Match Pitch</span>
                              {rec.otakuPitch}
                            </p>
                            <button
                              onClick={() => {
                                onAskAIAboutManga(rec.title);
                                setSelectedManga(null);
                              }}
                              className="w-full py-1 text-[10px] font-semibold rounded bg-[#10a37f]/15 hover:bg-[#10a37f]/25 border border-[#10a37f]/20 text-[#10a37f] transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Convince me & talk!</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SYNERGIZING INTEGRATION ACTIONS BAR */}
            <div className="p-4 bg-[#141414] border-t border-white/5 flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  const mTitle = selectedManga.title.english || selectedManga.title.romaji || selectedManga.title.userPreferred;
                  onAskAIAboutManga(mTitle);
                  setSelectedManga(null);
                }}
                className="w-full bg-[#10a37f] hover:bg-[#0d8a6a] text-white text-xs font-semibold py-2 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ask AI Recommender About This Title</span>
              </button>
              
              <a
                href={selectedManga.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#2a2a2a] hover:bg-[#343434] text-gray-200 hover:text-white text-xs font-semibold py-2 px-4 rounded-xl transition border border-white/5 flex items-center justify-center gap-1"
              >
                <span>View Full AniList Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
