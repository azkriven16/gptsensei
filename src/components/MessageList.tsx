/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import MessageItem from './MessageItem';
import SuggestionCards from './SuggestionCards';
import { Message } from '../types';

interface MessageListProps {
  key?: string;
  messages: Message[];
  isGenerating: boolean;
  onSelectSuggestion: (prompt: string) => void;
  onAskAIAboutManga?: (mangaTitle: string) => void;
}

export default function MessageList({ messages, isGenerating, onSelectSuggestion, onAskAIAboutManga }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic triggered when messages lengthen or generation status changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isGenerating]);

  const isEmpty = messages.length === 0;

  if (isEmpty) {
    return (
      <div 
        id="empty-chat-welcome" 
        className="flex-grow flex flex-col justify-center items-center py-4 sm:py-10 px-4 max-w-[800px] mx-auto w-full font-sans select-none welcome-fade-in"
      >
        {/* Glow GPTSenpai sparkle ring emblem */}
        <div className="relative mb-3 sm:mb-6">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-110" />
          <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#2f2f2f]/60 flex items-center justify-center border border-[#3e3e3e]/40 shadow-md">
            <Sparkles className="w-5.5 h-5.5 sm:w-7 sm:h-7 text-[#10a37f]" />
          </div>
        </div>

        {/* Dynamic header text */}
        <h1 className="text-xl sm:text-2xl md:text-3.5xl font-bold font-sans tracking-tight text-white mb-4 sm:mb-8 text-center">
          What are we reading today? 📚
        </h1>

        {/* Creative suggestions prompt cards */}
        <div className="w-full">
          <SuggestionCards onSelectSuggestion={onSelectSuggestion} />
        </div>
      </div>
    );
  }

  return (
    <div id="active-chat-scrollpane" className="flex-grow overflow-y-auto w-full">
      <div className="w-full flex flex-col">
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            isLatest={messages[messages.length - 1].id === message.id}
            onAskAIAboutManga={onAskAIAboutManga}
          />
        ))}

        {/* Sub-block displaying the active generation typing status bubble */}
        {isGenerating && (
          <div id="ai-typing-status-indicator" className="py-6 px-4 w-full bg-[#212121]/30 border-b border-[#2a2a2a]/20 animate-pulse">
            <div className="max-w-[720px] mx-auto flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex-grow pt-1.5">
                <div className="flex items-center gap-1.5 text-gray-400 text-sm typing-dots">
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                  <span className="text-xs text-gray-500 font-semibold ml-1 capitalize tracking-wide">
                    GPTSenpai is typing...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-20 flex-shrink-0" />
      </div>
    </div>
  );
}
