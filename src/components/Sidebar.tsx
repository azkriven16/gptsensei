/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Settings, 
  Edit3, 
  Check, 
  X, 
  PanelLeftClose, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Chat } from '../types';
import MangaExplorer from './MangaExplorer';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  onClearHistory: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userEmail?: string;
  onOpenSettings: () => void;
  onAskAIAboutManga: (mangaTitle: string) => void;
  sidebarRight?: boolean;
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onClearHistory,
  isSidebarOpen,
  setSidebarOpen,
  userEmail = 'azkriven16@gmail.com',
  onOpenSettings,
  onAskAIAboutManga,
  sidebarRight = false,
}: SidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const cached = localStorage.getItem('gptsenpai_sidebar_width');
    const width = cached ? Number(cached) : 340;
    return Number.isFinite(width) ? Math.min(Math.max(width, 300), 620) : 340;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const maxWidth = Math.min(620, Math.floor(window.innerWidth * 0.6));

    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = sidebarRight ? startWidth - delta : startWidth + delta;
      const clampedWidth = Math.min(Math.max(nextWidth, 300), maxWidth);
      setSidebarWidth(clampedWidth);
      localStorage.setItem('gptsenpai_sidebar_width', String(Math.round(clampedWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const startRename = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Helper to categorize chats into standard time intervals
  const getGroupedChats = () => {
    const today: Chat[] = [];
    const yesterday: Chat[] = [];
    const older: Chat[] = [];

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    chats.forEach((chat) => {
      const createdDate = new Date(chat.createdAt);
      const diffTime = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffTime / oneDay);

      if (diffDays === 0) {
        today.push(chat);
      } else if (diffDays === 1) {
        yesterday.push(chat);
      } else {
        older.push(chat);
      }
    });

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Previous 7 Days', items: older },
    ].filter(group => group.items.length > 0);
  };

  const grouped = getGroupedChats();

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Mobile background backdrop overlay to close sidebar easily */}
      <div 
        onClick={() => setSidebarOpen(false)}
        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity cursor-pointer animate-in fade-in duration-200"
      />
      
      <div 
        id="sidebar-container"
        style={{ width: `min(${sidebarWidth}px, 92vw)` }}
        className={`flex-shrink-0 h-full bg-[#171717] flex flex-col justify-between select-none font-sans fixed md:relative inset-y-0 md:inset-y-auto ${
          isResizing ? '' : 'transition-all duration-300 ease-out'
        } ${
          sidebarRight 
            ? 'right-0 md:right-auto border-l border-white/5 shadow-2xl' 
            : 'left-0 md:left-auto border-r border-white/5 shadow-2xl'
        } z-50 md:z-30 md:shadow-none ${
          sidebarRight 
            ? 'animate-in slide-in-from-right duration-250' 
            : 'animate-in slide-in-from-left duration-250'
        }`}
      >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        onMouseDown={handleResizeStart}
        className={`hidden md:block absolute top-0 h-full w-2 cursor-col-resize z-40 group ${
          sidebarRight ? '-left-1' : '-right-1'
        }`}
        title="Drag to resize sidebar"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent group-hover:bg-[#10a37f]/50 transition-colors" />
      </div>
      {/* Top action and toggle bar */}
      <div className="p-3.5 flex flex-col gap-2 flex-grow overflow-hidden">
        {/* Header Title and Collapse Button */}
        <div className="flex items-center justify-between gap-2 pb-1.5 flex-shrink-0">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#10a37f] bg-[#10a37f]/10 border border-[#10a37f]/20 px-2 py-0.5 rounded-md">
              Manga Hub
            </span>
          </div>
          <button
            id="collapse-sidebar-btn"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-[#2f2f2f] rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Selected Panels View Container */}
        <div className="flex-grow flex flex-col overflow-hidden min-h-0 mt-1">
          <div className="flex-grow flex flex-col overflow-hidden min-h-0 animate-in fade-in duration-250">
              {/* Create new session button styled to follow GPTSenpai aesthetics */}
              <button
                id="new-chat-btn"
                onClick={onNewChat}
                className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white/90 hover:bg-[#2f2f2f] border border-white/5 hover:border-white/10 transition-colors bg-white/5 hover:shadow-sm cursor-pointer mb-2.5"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>New chat</span>
                </div>
                <Plus className="w-3.5 h-3.5 text-white/40" />
              </button>

              {/* Scrollable history lists grouped by time frames */}
              <div className="flex-grow overflow-y-auto pr-0.5 space-y-5 scrollbar-thin mb-2.5">
                {chats.length === 0 ? (
                  <div className="h-24 flex flex-col items-center justify-center text-center px-4">
                    <MessageSquare className="w-6 h-6 text-white/10 mb-1.5" />
                    <p className="text-[11px] text-white/40 font-medium leading-relaxed">
                      No history yet. Start a new chat!
                    </p>
                  </div>
                ) : (
                  grouped.map((group) => (
                    <div key={group.label} className="space-y-1" id={`group-${group.label.replace(/\s+/g, '-').toLowerCase()}`}>
                      <h3 className="text-[10px] font-bold text-white/30 tracking-wider px-2.5 select-none mb-0.5">
                        {group.label}
                      </h3>
                      <div className="space-y-0.5">
                        {group.items.map((chat) => {
                          const isActive = chat.id === activeChatId;
                          const isEditing = chat.id === editingId;

                          return (
                            <div
                              key={chat.id}
                              id={`chat-item-${chat.id}`}
                              onClick={() => !isEditing && onSelectChat(chat.id)}
                              className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 cursor-pointer ${
                                isActive 
                                  ? 'bg-[#2c2c2c] text-white' 
                                  : 'text-white/70 hover:bg-[#2c2c2c]/50 hover:text-white'
                              }`}
                            >
                              <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#10a37f]' : 'text-white/40 group-hover:text-white/60'}`} />
                              
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRename(chat.id, e as any);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                  className="bg-[#171717] text-white border border-[#10a37f] rounded px-1.5 py-0.5 text-xs w-full focus:outline-none"
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              ) : (
                                <span className="truncate pr-16 block font-normal">
                                  {chat.title}
                                </span>
                              )}

                              {/* Inline actions overlay displayed on hover (or active status) */}
                              <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-gradient-to-l from-transparent group-hover:from-[#2c2c2c] pl-6 h-[80%] transition-colors duration-150 opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-100 from-[#2c2c2c]' : ''}`}>
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={(e) => saveRename(chat.id, e)}
                                      className="p-1 hover:text-[#10a37f] text-white/40 transition"
                                      title="Save name"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={cancelRename}
                                      className="p-1 hover:text-rose-400 text-white/40 transition"
                                      title="Cancel rename"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => startRename(chat, e)}
                                      className="p-1 hover:text-white text-white/40 transition-colors rounded hover:bg-[#3e3e3e]"
                                      title="Rename Chat"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteChat(chat.id);
                                      }}
                                      className="p-1 hover:text-rose-500 text-white/40 transition-colors rounded hover:bg-[#3e3e3e]"
                                      title="Delete Chat"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {chats.length > 0 && (
                <button
                  id="clear-all-chats-btn"
                  onClick={onClearHistory}
                  className="flex-shrink-0 w-full flex items-center justify-center gap-2 py-2 mb-2.5 text-xs text-white/40 hover:text-rose-400 hover:bg-[#2f2f2f]/30 border border-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear conversations</span>
                </button>
              )}

              {/* AniList Database panel replaces the removed personality selector */}
              <div className="flex-shrink-0 h-[500px] max-h-[62vh] overflow-hidden border border-white/5 rounded-xl bg-black/15" id="sidebar-anilist-panel">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/20">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">AniList Database</span>
                  </div>
                  <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.2 rounded font-bold tracking-wider">Search</span>
                </div>
                <MangaExplorer onAskAIAboutManga={onAskAIAboutManga} />
              </div>
          </div>
        </div>
      </div>

      {/* Bottom utility capsule: user profile and settings trigger */}
      <div className="border-t border-white/5 p-3 flex flex-col gap-2 bg-[#171717]">
        <div id="user-footer-capsule" className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[#2f2f2f] transition-all duration-150 text-white cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs select-none shadow-sm flex-shrink-0">
              {userEmail.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left leading-tight min-w-0">
              <div className="text-xs font-semibold text-white/90 truncate">azkriven</div>
              <div className="text-[10px] text-white/40 truncate">{userEmail}</div>
            </div>
          </div>
          
          <button
            id="sidebar-settings-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="p-1.5 hover:bg-[#3e3e3e] rounded-md text-white/40 hover:text-white transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
