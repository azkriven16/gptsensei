/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink, 
  Globe, 
  Terminal,
  Sparkles,
  User,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Message, CodeSource } from '../types';
import { getDisplayGenre } from '../utils/mediaLabels';

interface MessageItemProps {
  message: Message;
  isLatest: boolean;
  onAskAIAboutManga?: (mangaTitle: string) => void;
  key?: any;
}

const fetchAniListInfo = async (title: string) => {
  const query = `
    query ($search: String) {
      Media (search: $search, type: MANGA) {
        id
        title {
          userPreferred
          english
          romaji
        }
        coverImage {
          large
        }
        siteUrl
        format
        genres
        averageScore
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
      const media = result.data?.Media;
      return {
        coverImage: media?.coverImage?.large || null,
        siteUrl: media?.siteUrl || null,
        format: media?.format || null,
        genres: media?.genres || [],
        score: media?.averageScore || null,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch AniList info inside chat for:', title, err);
  }
  return { coverImage: null, siteUrl: null, format: null, genres: [], score: null };
};

function MangaImage({ src, alt }: { src: string; alt: string }) {
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

export default function MessageItem({ message, isLatest, onAskAIAboutManga }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [thumbs, setThumbs] = useState<'up' | 'down' | null>(null);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const [enrichedManga, setEnrichedManga] = useState<{
    title: string;
    coverImage: string | null;
    siteUrl: string | null;
    format?: string;
    genres?: string[];
    score?: number;
  }[]>([]);
  const [loadingManga, setLoadingManga] = useState(false);
  const [detectedTitles, setDetectedTitles] = useState<string[]>([]);

  const isUser = message.role === 'user';

  const renderMangaDeck = (isBottom = false) => {
    if (isUser) return null;
    if (message.isError) return null;
    if (detectedTitles.length === 0) return null;

    return (
      <div className={`${isBottom ? 'mt-5 pt-4 border-t' : 'mb-5 pb-4 border-b'} border-white/5 space-y-3`}>
        <div className="flex items-center justify-between text-xs font-semibold text-[#10a37f] tracking-wide select-none">
          <div className="flex items-center gap-1.5 font-semibold text-[#10a37f]">
            <BookOpen className="w-3.5 h-3.5 animate-pulse" />
            <span>Featured Masterpieces Spotlights</span>
          </div>
          {loadingManga && (
            <span className="text-[10px] text-[#10a37f] animate-pulse font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-ping" />
              Syncing AniList...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {detectedTitles.map((title, idx) => {
            const manga = enrichedManga.find(m => m.title.toLowerCase() === title.toLowerCase());
            
            if (manga) {
              return (
                <div 
                  key={idx}
                  className="bg-black/25 p-3 rounded-xl border border-white/5 flex gap-3 hover:border-[#10a37f]/30 hover:bg-black/35 transition duration-150 group relative animate-fade-in"
                >
                  {/* Cover image thumbnail */}
                  {manga.coverImage ? (
                    <div className="w-14 h-20 rounded-lg overflow-hidden bg-[#1f1f1f] border border-white/10 flex-shrink-0 shadow shadow-black/80">
                      <MangaImage src={manga.coverImage} alt={manga.title} />
                    </div>
                  ) : (
                    <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-[#2a2a2a] to-[#121212] border border-white/10 flex-shrink-0 shadow shadow-black/80 flex flex-col items-center justify-center p-1.5 text-center select-none">
                      <BookOpen className="w-4 h-4 text-[#10a37f] mb-1 opacity-80" />
                      <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-none truncate w-full">
                        No Cover
                      </span>
                    </div>
                  )}

                  <div className="flex-grow min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-white truncate leading-snug group-hover:text-[#10a37f] transition-colors" title={manga.title}>
                          {manga.title}
                        </h4>
                        {manga.siteUrl ? (
                          <a 
                            href={manga.siteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-white transition p-0.5 flex-shrink-0"
                            title="View details on AniList"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[8px] font-mono text-gray-400 bg-white/5 px-1 py-0.2 rounded leading-none">Local</span>
                        )}
                      </div>

                      {manga.genres && manga.genres.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-1 max-h-8 overflow-hidden">
                          {manga.genres.slice(0, 2).map((g, gIdx) => (
                            <span key={gIdx} className="text-[9px] px-1.5 py-0.2 bg-[#2f2f2f] text-gray-450 rounded-md">
                              {getDisplayGenre(g)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[9px] text-gray-500 italic">No genres logged</div>
                      )}
                    </div>

                    <div className="flex-grow flex items-end">
                      <div className="flex items-center justify-between w-full gap-2 select-none">
                        <div className="flex items-center gap-2">
                          {manga.format && (
                            <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
                              {manga.format}
                            </span>
                          )}
                          {manga.score && (
                            <span className="text-[9px] font-bold text-amber-500">
                              ★ {manga.score}%
                            </span>
                          )}
                        </div>

                        {onAskAIAboutManga && (
                          <button
                            onClick={() => onAskAIAboutManga(manga.title)}
                            className="text-[9px] font-bold text-[#10a37f] hover:underline flex items-center gap-0.5 cursor-pointer hover:text-white transition-colors animate-pulse"
                          >
                            <span>Consult</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div 
                  key={idx}
                  className="bg-black/25 p-3 rounded-xl border border-white/5 flex gap-3 animate-pulse"
                >
                  <div className="w-14 h-20 rounded-lg bg-[#111] border border-white/5 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                    <BookOpen className="w-4 h-4 text-[#10a37f]/20 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="flex-grow min-w-0 flex flex-col justify-between py-1">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 truncate" title={title}>
                        {title}
                      </h4>
                      <div className="h-2.5 bg-white/5 rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="h-2 bg-[#10a37f]/10 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  // Synchronous, immediate title parser for instant streaming skeletons
  useEffect(() => {
    if (isUser) return;
    if (message.isError) {
      setDetectedTitles([]);
      return;
    }
    if (!message.content) return;

    const lines = message.content.split('\n');
    const parsed: string[] = [];
    for (let line of lines) {
      line = line.trim();
      let cleanedLine = line.replace(/^[^\w\s\*\d]+/g, '').trim(); 
      const listMatch = cleanedLine.match(/^(\d+)\.\s+(\*\*|)([^*:(\-\n]+)/);
      if (listMatch) {
        let title = listMatch[3].trim();
        title = title.replace(/\*\*$/, '').trim();
        title = title.replace(/[:\-\(]$/, '').trim();
        
        const noiseWords = ['author', 'synopsis', 'genre', 'genres', 'premise', 'insight', 'otaku', 'match pitch', 'pitch', 'what people say', 'what community says'];
        const isNoise = noiseWords.some(word => title.toLowerCase().includes(word));

        if (title && title.length > 1 && title.length < 60 && !isNoise) {
          if (!parsed.includes(title)) {
            parsed.push(title);
          }
        }
      }
    }
    
    if (parsed.length !== detectedTitles.length || !parsed.every((val, i) => val === detectedTitles[i])) {
      setDetectedTitles(parsed);
    }
  }, [message.content, isUser, message.isError]);

  // Handle live parsing & on-the-fly search enrichment for recommended names
  useEffect(() => {
    if (isUser) return;
    if (message.isError) return;
    
    const timer = setTimeout(() => {
      extractAndEnrichManga();
    }, 1500);

    return () => clearTimeout(timer);
  }, [message.content, isUser, message.isError]);

  const extractAndEnrichManga = async () => {
    if (!message.content) return;

    const lines = message.content.split('\n');
    const parsedTitles: string[] = [];

    for (let line of lines) {
      line = line.trim();
      let cleanedLine = line.replace(/^[^\w\s\*\d]+/g, '').trim(); 
      
      const listMatch = cleanedLine.match(/^(\d+)\.\s+(\*\*|)([^*:(\-\n]+)/);
      if (listMatch) {
         let title = listMatch[3].trim();
         title = title.replace(/\*\*$/, '').trim();
         title = title.replace(/[:\-\(]$/, '').trim();
         
         const noiseWords = ['author', 'synopsis', 'genre', 'genres', 'premise', 'insight', 'otaku', 'match pitch', 'pitch', 'what people say', 'what community says'];
         const isNoise = noiseWords.some(word => title.toLowerCase().includes(word));

         if (title && title.length > 1 && title.length < 60 && !isNoise) {
           if (!parsedTitles.includes(title)) {
             parsedTitles.push(title);
           }
         }
      }
    }

    if (parsedTitles.length === 0) {
      setEnrichedManga([]);
      return;
    }

    const currentTitles = enrichedManga.map(m => m.title);
    const isIdentical = parsedTitles.length === currentTitles.length && parsedTitles.every(t => currentTitles.includes(t));
    if (isIdentical) return;

    setLoadingManga(true);
    try {
      const results = await Promise.all(
        parsedTitles.map(async (title) => {
          const aniInfo = await fetchAniListInfo(title);
          return {
            title,
            coverImage: aniInfo.coverImage,
            siteUrl: aniInfo.siteUrl,
            format: aniInfo.format || undefined,
            genres: aniInfo.genres || undefined,
            score: aniInfo.score || undefined,
          };
        })
      );
      // Save all results so that we are showing a card even with missing covers
      setEnrichedManga(results);
    } catch (err) {
      console.error('Failed to enrich recommendations:', err);
    } finally {
      setLoadingManga(false);
    }
  };

  // Handle cleanup of speech when message is destroyed
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadAloud = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown characters from TTS feedback
    const plainText = message.content
      .replace(/```[\s\S]*?```/g, '[Code block omitted]')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\* ([^\n]+)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setSpeechUtterance(utterance);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Track matched manga titles during a single markdown render pass to avoid duplicate inline cards
  const matchedMangaTitles = new Set<string>();

  // Custom JSX rich parser for Markdown elements (Safe alternative to raw HTML injection)
  const parseMarkdown = (text: string) => {
    if (!text) return null;

    matchedMangaTitles.clear();

    const findMatchingManga = (lineText: string) => {
      if (enrichedManga.length === 0) return null;
      for (const manga of enrichedManga) {
        if (matchedMangaTitles.has(manga.title)) continue;

        const escapedTitle = manga.title.toLowerCase().replace(/['"“”’‘:\-\s]/g, '');
        const escapedLine = lineText.toLowerCase().replace(/['"“”’‘:\-\s]/g, '');
        
        if (escapedLine.includes(escapedTitle)) {
          const noiseWords = ['author:', 'synopsis:', 'genre', 'insight', 'pitch:', 'what people say', 'what community says', 'average score'];
          const isNoise = noiseWords.some(word => lineText.toLowerCase().includes(word));
          if (!isNoise) {
            matchedMangaTitles.add(manga.title);
            return manga;
          }
        }
      }
      return null;
    };

    // Split text by code blocks ```
    const blocks = text.split(/(```[\s\S]*?```)/g);

    return blocks.map((block, bIdx) => {
      // If it is a code block
      if (block.startsWith('```') && block.endsWith('```')) {
        const fullContent = block.slice(3, -3).trim();
        const codeLines = fullContent.split('\n');
        let language = 'code';
        let codeBody = fullContent;

        // Extract first line language if valid
        if (codeLines.length > 1 && codeLines[0].length < 15 && !codeLines[0].includes(' ') && !codeLines[0].includes('=')) {
          language = codeLines[0];
          codeBody = codeLines.slice(1).join('\n');
        }

        return (
          <CodeBlock 
            key={bIdx} 
            language={language} 
            code={codeBody} 
          />
        );
      }

      // Handle standard text lines (bold, code lists, bullet items)
      const lines = block.split('\n');
      return (
        <div key={bIdx} className="space-y-2 mt-2 first:mt-0">
          {lines.map((line, lIdx) => {
            // Empty line
            if (line.trim() === '') {
              return <div key={lIdx} className="h-2" />;
            }

            // Bullet list items
            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
              const cleaned = line.trim().substring(2);
              return (
                <ul key={lIdx} className="list-disc list-inside pl-4 text-white/90 mt-1 space-y-1">
                  <li>{parseInlines(cleaned)}</li>
                </ul>
              );
            }

            // Numbered list items
            const numberedMatch = line.trim().match(/^(\d+)\.\s(.*)/);
            if (numberedMatch) {
              const num = numberedMatch[1];
              const cleaned = numberedMatch[2];
              return (
                <ol key={lIdx} className="list-decimal list-inside pl-4 text-white/90 mt-1 space-y-1">
                  <li>
                    <span className="font-semibold text-white/40 mr-1">{num}.</span>
                    {parseInlines(cleaned)}
                  </li>
                </ol>
              );
            }

            // Headings
            if (line.startsWith('### ')) {
              return (
                <h3 key={lIdx} className="text-sm font-bold text-white tracking-wide mt-4 mb-2">
                  {parseInlines(line.substring(4))}
                </h3>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2 key={lIdx} className="text-base font-bold text-white tracking-wide mt-5 mb-2.5 border-b border-white/5 pb-1">
                  {parseInlines(line.substring(3))}
                </h2>
              );
            }

            // Standard Paragraph
            return (
              <p key={lIdx} className="text-white/90 leading-relaxed text-[15px] font-sans">
                {parseInlines(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Helper parser for inline bold, code backticks, etc.
  const parseInlines = (text: string) => {
    // Escape backticks formatting first
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

    return parts.map((part, idx) => {
      // Code backticks
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="bg-[#2f2f2f] text-[#10a37f] font-mono text-xs px-1.5 py-0.5 rounded border border-white/5">
            {part.slice(1, -1)}
          </code>
        );
      }
      // Bold Markdown
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div 
      id={`msg-${message.id}`} 
      className={`py-4 sm:py-6 px-2 sm:px-4 w-full border-b border-white/5 group/item hover:bg-[#212121]/15 transition-colors duration-150 ${
        isUser ? 'bg-transparent' : 'bg-[#171717]/10 border-y border-white/5'
      }`}
    >
      <div className={`max-w-[760px] mx-auto flex items-start gap-0 sm:gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar badge */}
        <div className="hidden sm:block flex-shrink-0 mt-0.5" id={`avatar-${message.id}`}>
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-slate-500 transition-colors flex items-center justify-center text-white text-xs select-none shadow font-bold">
              JD
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-white shadow-md animate-fade-in">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
          )}
        </div>

        {/* Content body layout */}
        <div className={`flex-grow min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`} id={`chat-body-${message.id}`}>
          <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-ai'} ${isUser ? 'max-w-[94%] sm:max-w-[82%]' : 'w-full'}`}>
            {/* Attached items indicators if any */}
            {message.attachmentName && message.attachmentData && (
              <div className="mb-3 flex items-center gap-2 bg-[#2f2f2f]/30 p-2 rounded-xl border border-white/5 max-w-sm">
                <div className="p-2 bg-[#171717]/80 rounded-lg">
                  {message.attachmentType?.startsWith('image/') ? (
                    <img 
                      src={message.attachmentData} 
                      alt={message.attachmentName} 
                      className="w-8 h-8 object-cover rounded" 
                    />
                  ) : (
                    <Terminal className="w-4 h-4 text-[#10a37f]" />
                  )}
                </div>
                <div className="min-w-0 flex-grow text-left leading-tight">
                  <div className="text-xs font-semibold text-white/95 truncate">{message.attachmentName}</div>
                  <div className="text-[10px] text-white/40 capitalize truncate">
                    {message.attachmentType?.split('/')[1] || 'Document'}
                  </div>
                </div>
              </div>
            )}

            {/* Render dynamic background-enriched AniList manga cards deck at the top */}
            {renderMangaDeck(false)}

            {/* Render parsed markdown text */}
            <div className="prose prose-invert prose-sm max-w-none">
              {parseMarkdown(message.content)}
            </div>

            {/* Render dynamic background-enriched AniList manga cards deck at the bottom as well */}
            {renderMangaDeck(true)}

            {/* Render Grounding sources citation accordion if present */}
            {message.searchSources && message.searchSources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5" id={`search-sources-${message.id}`}>
                <div className="flex items-center gap-1.5 text-xs text-[#10a37f] font-semibold tracking-wide mb-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Web Search Citations</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {message.searchSources.map((source, sIdx) => (
                    <a
                      key={sIdx}
                      href={source.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 bg-[#2f2f2f]/30 border border-white/5 rounded-lg p-2 hover:bg-[#2f2f2f]/70 transition-colors text-left"
                    >
                      <div className="min-w-0 leading-tight">
                        <div className="text-xs text-white/90 font-semibold truncate hover:underline">
                          {source.title}
                        </div>
                        <div className="text-[10px] text-white/40 truncate mt-0.5">
                          {source.uri.replace(/https?:\/\/(www\.)?/, '')}
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-white/40 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions Bar displayed for bot responses, or hover trigger */}
          {!isUser && (
            <div className="mt-4 flex items-center gap-2 text-white/40 opacity-100 group-hover/item:opacity-100 sm:opacity-50 transition-opacity duration-200">
              {/* Copy action */}
              <button
                onClick={copyToClipboard}
                className="p-1.5 hover:text-white hover:bg-[#2f2f2f] rounded-lg transition-colors cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* TTS Sound trigger */}
              <button
                onClick={handleReadAloud}
                className={`p-1.5 hover:text-white hover:bg-[#2f2f2f] rounded-lg transition-colors cursor-pointer ${
                  isSpeaking ? 'text-[#10a37f]' : ''
                }`}
                title={isSpeaking ? "Pause readout" : "Read aloud"}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Quality thumbs */}
              <button
                onClick={() => setThumbs(thumbs === 'up' ? null : 'up')}
                className={`p-1.5 hover:text-[#10a37f] hover:bg-[#2f2f2f] rounded-lg transition-colors cursor-pointer ${
                  thumbs === 'up' ? 'text-[#10a37f] bg-[#2f2f2f]' : ''
                }`}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setThumbs(thumbs === 'down' ? null : 'down')}
                className={`p-1.5 hover:text-rose-500 hover:bg-[#2f2f2f] rounded-lg transition-colors cursor-pointer ${
                  thumbs === 'down' ? 'text-rose-500 bg-[#2f2f2f]' : ''
                }`}
                title="Unhelpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              {message.isError && (
                <span className="text-xs text-rose-400 font-medium ml-2">
                  Key required / Server failure
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-Component for isolated code blocks with custom copying mechanics
interface CodeBlockProps {
  language: string;
  code: string;
  key?: any;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-white/5 bg-[#171717] overflow-hidden shadow-lg font-mono">
      {/* Code Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2f2f2f] border-b border-white/5 select-none">
        <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer font-sans"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs leading-relaxed text-[#ececec] font-mono whitespace-pre select-text">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
