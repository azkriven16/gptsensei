/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Plus, PanelLeft, PanelRight, Palette } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import DesignLabModal from './components/DesignLabModal';
import { Chat, Message, DesignSettings, DEFAULT_DESIGN_SETTINGS } from './types';

const ENABLE_LIMIT_FALLBACK_TEST = false;

export default function App() {
  // Sync core chat states from LocalStorage for seamless sessions caching
  const [chats, setChats] = useState<Chat[]>(() => {
    const cached = localStorage.getItem('gptsenpai_clone_chats');
    return cached ? JSON.parse(cached) : [];
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    return localStorage.getItem('gptsenpai_clone_active_id') || null;
  });

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('gptsenpai_clone_username') || 'azkriven';
  });

  const [designSettings, setDesignSettings] = useState<DesignSettings>(() => {
    const cached = localStorage.getItem('gptsenpai_clone_design_settings');
    return cached ? JSON.parse(cached) : DEFAULT_DESIGN_SETTINGS;
  });

  const [inputText, setInputText] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; type: string; data: string } | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isDesignLabOpen, setDesignLabOpen] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync state modifications directly to browsers localStorage
  useEffect(() => {
    localStorage.setItem('gptsenpai_clone_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('gptsenpai_clone_active_id', activeChatId);
    } else {
      localStorage.removeItem('gptsenpai_clone_active_id');
    }
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem('gptsenpai_clone_username', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('gptsenpai_clone_design_settings', JSON.stringify(designSettings));

    const ACCENT_COLORS = {
      teal: { hex: '#10a37f', hover: '#0d8a6a' },
      indigo: { hex: '#6366f1', hover: '#4f46e5' },
      rose: { hex: '#f43f5e', hover: '#e11d48' },
      amber: { hex: '#f59e0b', hover: '#d97706' },
      sky: { hex: '#0ea5e9', hover: '#0284c7' }
    };
    const accent = ACCENT_COLORS[designSettings.accentColor];

    const MOOD_COLORS = {
      midnight: { sidebar: '#171717', main: '#212121', card: '#2f2f2f', text: '#ececec', sidebarRgb: '23,23,23', cardRgb: '47,47,47' },
      'jet-black': { sidebar: '#000000', main: '#090909', card: '#161616', text: '#fcfcfc', sidebarRgb: '0,0,0', cardRgb: '22,22,22' },
      'warm-coffee': { sidebar: '#181413', main: '#231e1d', card: '#2e2726', text: '#f4ebe8', sidebarRgb: '24,20,19', cardRgb: '46,39,38' },
      cyberpunk: { sidebar: '#0a0514', main: '#120b22', card: '#1f1435', text: '#f6f0ff', sidebarRgb: '10,5,20', cardRgb: '31,20,53' }
    };
    const mood = MOOD_COLORS[designSettings.surfaceMood];

    const RAD_CONFIG = {
      none: '0px',
      md: '6px',
      xl: '12px',
      full: '24px'
    };
    const radius = RAD_CONFIG[designSettings.borderRadius];

    const SANS_CONFIG = {
      inter: 'Inter, sans-serif',
      'space-grotesk': '"Space Grotesk", sans-serif',
      outfit: 'Outfit, sans-serif',
      playfair: '"Playfair Display", serif'
    };
    const MONO_CONFIG = {
      'jetbrains-mono': '"JetBrains Mono", monospace',
      'fira-code': '"Fira Code", monospace',
      'source-code': '"Source Code Pro", monospace'
    };
    const fontSans = SANS_CONFIG[designSettings.fontSans];
    const fontMono = MONO_CONFIG[designSettings.fontMono];

    let sizeBase = '15px';
    let sizeSidebar = '14px';
    let sizeDesc = '11px';
    if (designSettings.fontSize === 'sm') {
      sizeBase = '13.5px';
      sizeSidebar = '13px';
      sizeDesc = '10px';
    } else if (designSettings.fontSize === 'lg') {
      sizeBase = '16.5px';
      sizeSidebar = '15px';
      sizeDesc = '12px';
    }

    const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(accent.hex);
    const accentRgb = hexMatch ? `${parseInt(hexMatch[1], 16)},${parseInt(hexMatch[2], 16)},${parseInt(hexMatch[3], 16)}` : '16,163,127';

    const css = `
      :root {
        --font-sans: ${fontSans} !important;
        --font-mono: ${fontMono} !important;
        --accent-color: ${accent.hex} !important;
        --accent-hover: ${accent.hover} !important;
        --sidebar-bg: ${mood.sidebar} !important;
        --main-bg: ${mood.main} !important;
        --card-bg: ${mood.card} !important;
        --text-main: ${mood.text} !important;
        --rounded-custom-xl: ${radius} !important;
        --rounded-custom-2xl: calc(${radius} + 4px) !important;
      }

      body {
        font-family: ${fontSans} !important;
        background-color: var(--main-bg) !important;
        color: var(--text-main) !important;
      }

      /* Force class properties font overrides */
      .font-sans, p, span, h1, h2, h3, h4, font, div, input, textarea, button { font-family: ${fontSans} !important; }
      .font-mono, pre, code { font-family: ${fontMono} !important; }

      /* Override container backgrounds dynamically */
      .bg-\\[\\#212121\\] { background-color: var(--main-bg) !important; }
      .bg-\\[\\#171717\\] { background-color: var(--sidebar-bg) !important; }
      .bg-\\[\\#2f2f2f\\] { background-color: var(--card-bg) !important; }
      .bg-\\[\\#2f2f2f\\]\\/30 { background-color: rgba(${mood.cardRgb}, 0.3) !important; }
      .bg-\\[\\#2f2f2f\\]\\/35 { background-color: rgba(${mood.cardRgb}, 0.35) !important; }
      .bg-\\[\\#2f2f2f\\]\\/60 { background-color: rgba(${mood.cardRgb}, 0.6) !important; }
      .bg-\\[\\#171717\\]\\/80 { background-color: rgba(${mood.sidebarRgb}, 0.8) !important; }

      /* Dynamic custom active hover profiles */
      .hover\\:bg-\\[\\#2f2f2f\\]:hover { background-color: rgba(${mood.cardRgb}, 0.5) !important; }
      .hover\\:bg-\\[\\#2f2f2f\\]\\/60:hover { background-color: rgba(${mood.cardRgb}, 0.6) !important; }
      .hover\\:bg-\\[\\#2f2f2f\\]\\/50:hover { background-color: rgba(${mood.cardRgb}, 0.5) !important; }

      /* Accent overrides dynamically */
      .text-\\[\\#10a37f\\], .text-teal-400 { color: var(--accent-color) !important; }
      .bg-\\[\\#10a37f\\], .bg-indigo-600 { background-color: var(--accent-color) !important; }
      .bg-indigo-600:hover { background-color: var(--accent-hover) !important; }
      .border-\\[\\#10a37f\\] { border-color: var(--accent-color) !important; }
      .focus-within\\:border-emerald-500\\/50:focus-within { border-color: rgba(${accentRgb}, 0.5) !important; }
      .focus-within\\:border-\\[\\#10a37f\\]\\/50:focus-within { border-color: rgba(${accentRgb}, 0.5) !important; }

      /* Border Radiuses dynamically scaling curves */
      .rounded-2xl { border-radius: var(--rounded-custom-2xl) !important; }
      .rounded-\\[26px\\] { border-radius: calc(var(--rounded-custom-xl) * 2) !important; }
      .rounded-xl { border-radius: var(--rounded-custom-xl) !important; }
      .rounded-lg { border-radius: calc(var(--rounded-custom-xl) * 0.75) !important; }
      .rounded-md { border-radius: calc(var(--rounded-custom-xl) * 0.5) !important; }

      /* Dynamic scalable font sizing interfaces */
      .text-\\[15px\\] { font-size: ${sizeBase} !important; }
      .text-sm { font-size: ${sizeSidebar} !important; }
      .text-\\[11px\\] { font-size: ${sizeDesc} !important; }
    `;

    let styleTag = document.getElementById('design-lab-injected');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'design-lab-injected';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = css;
  }, [designSettings]);

  // Handle collapsible sidebar defaults responsive with screen widths on startup
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize(); // run once on boot
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Handler to create a new, completely empty conversation session
  const handleNewChat = () => {
    const isAlreadyEmpty = activeChat && activeChat.messages.length === 0;

    const newId = `chat_${Date.now()}`;
    const newChatSession: Chat = {
      id: newId,
      title: 'New conversation',
      messages: [],
      model: 'gpt-senpai',
      createdAt: new Date().toISOString(),
      webSearch: webSearch,
    };
    setChats(prev => [newChatSession, ...prev]);
    setActiveChatId(newId);
    setInputText('');
    setAttachment(null);

    // Show a high-contrast elegant feedback notification at the top of the interface
    if (isAlreadyEmpty) {
      setToast({
        id: Date.now(),
        message: 'Already on a fresh discussion canvas! 🍃',
        type: 'info'
      });
    } else {
      setToast({
        id: Date.now(),
        message: 'Started a fresh conversation series! 🌸',
        type: 'success'
      });
    }
  };

  // Handler to rename a specific chat
  const handleRenameChat = (id: string, newTitle: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === id) {
        return { ...chat, title: newTitle };
      }
      return chat;
    }));
  };

  // Handler to delete a chat
  const handleDeleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      const remaining = chats.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        setActiveChatId(null);
      }
    }
  };

  // Clear all chats
  const handleClearHistory = () => {
    setChats([]);
    setActiveChatId(null);
  };

  const handleUpdateUserName = (newName: string) => {
    setUserName(newName);
  };

  // Core submit handler for prompt executions
  const handleSubmitPrompt = async (forcedPrompt?: string) => {
    const promptToSend = forcedPrompt || inputText;
    if (!promptToSend.trim() && !attachment) return;

    // Reset editor immediately for rapid typing reactions
    setInputText('');

    let currentChatId = activeChatId;
    let targetChat = activeChat;

    // A. Create new chat session on the fly if user is writing on the root view
    if (!currentChatId || !targetChat) {
      const titleText = promptToSend.length > 26 
        ? `${promptToSend.substring(0, 24).trim()}...` 
        : promptToSend.trim();

      const newId = `chat_${Date.now()}`;
      const newChatSession: Chat = {
        id: newId,
        title: titleText || 'Attachment Query',
        messages: [],
        model: 'gpt-senpai',
        createdAt: new Date().toISOString(),
        webSearch: webSearch,
      };

      currentChatId = newId;
      targetChat = newChatSession;

      // React state update helper
      setChats(prev => [newChatSession, ...prev]);
      setActiveChatId(newId);
    } else {
      // If it is an existing chat and default titled, name it on the first message
      if (targetChat.messages.length === 0) {
        const titleText = promptToSend.length > 26 
          ? `${promptToSend.substring(0, 24).trim()}...` 
          : promptToSend.trim();
        
        setChats(prev => prev.map(c => {
          if (c.id === currentChatId) {
            return { ...c, title: titleText };
          }
          return c;
        }));
      }
    }

    // B. Append user's prompt message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: promptToSend,
      createdAt: new Date().toISOString(),
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
      attachmentData: attachment?.data,
    };

    const updatedMessages = [...(targetChat?.messages || []), userMessage];

    // Optimistically update frontend arrays
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        return { ...chat, messages: updatedMessages };
      }
      return chat;
    }));

    // Reset attached fields
    setAttachment(null);

    if (ENABLE_LIMIT_FALLBACK_TEST) {
      const limitFallbackMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `### Sign in to keep chatting\n\nYou are seeing the temporary limit fallback test.\n\n- Free preview: **5 AI responses**\n- Signed in: **20 AI responses/day**\n- Sign in with **Google** or **GitHub** to unlock the daily allowance.\n\nIf sign-in cannot be verified, GPT Senpai falls back to free preview mode instead of crashing.`,
        createdAt: new Date().toISOString(),
        isError: true,
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, messages: [...updatedMessages, limitFallbackMessage] };
        }
        return chat;
      }));
      return;
    }

    setIsGenerating(true);

    try {
      // Assemble full payload to forward to the secure node endpoint
      const proxyPayload = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
        attachmentName: m.attachmentName,
        attachmentType: m.attachmentType,
        attachmentData: m.attachmentData,
      }));

      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: proxyPayload,
          webSearch: webSearch,
          stream: true, // Request SSE streaming
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'The server encountered an error compiling a response.');
      }

      // Add a placeholder message for the assistant stream instantly
      const assistantMessageId = `msg_${Date.now() + 1}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, messages: [...updatedMessages, assistantMessage] };
        }
        return chat;
      }));

      // Set up the stream reader
      const reader = apiResponse.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) {
        throw new Error('Unable to initialize response stream reader.');
      }

      let accumulatedContent = '';
      let accumulatedSources: any[] = [];
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const payload = JSON.parse(trimmed.slice(6));
              
              if (payload.text) {
                accumulatedContent += payload.text;
              }
              if (payload.searchSources) {
                accumulatedSources = payload.searchSources;
              }

              // Direct real-time updates to the relevant chat state
              setChats(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                  return {
                    ...chat,
                    messages: chat.messages.map(m => {
                      if (m.id === assistantMessageId) {
                        return {
                          ...m,
                          content: accumulatedContent,
                          searchSources: accumulatedSources.length > 0 ? accumulatedSources : undefined,
                        };
                      }
                      return m;
                    }),
                  };
                }
                return chat;
              }));
            } catch (jsonErr) {
              // Ignore partial JSON chunks during live decoding
            }
          }
        }
      }

    } catch (err: any) {
      console.error('Failed to query assistant:', err);

      // Gracefully show mistake message in details
      const fallbackErrorMessage: Message = {
        id: `msg_${Date.now() + 2}`,
        role: 'assistant',
        content: `### Query failed\n\nGPT Senpai could not reach Gemini because **GEMINI_API_KEY** is missing, inactive, or rate-limited.\n\nFor local dev, check that .env.local contains GEMINI_API_KEY and restart the dev server.\n\nFor Cloudflare Pages, add GEMINI_API_KEY in the Pages project's Production environment variables, then redeploy.\n\nTechnical detail: ${err.message || 'Server timeout'}`,
        createdAt: new Date().toISOString(),
        isError: true,
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, messages: [...updatedMessages, fallbackErrorMessage] };
        }
        return chat;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct study / brainstorm clicks cards trigger
  const handleSelectSuggestionCard = (promptText: string) => {
    handleSubmitPrompt(promptText);
  };

  const handleAskAIAboutManga = (mangaTitle: string) => {
    // Adjust synergy questions dynamically based on selected persona!
    let detailsFocus = "";
    detailsFocus = "Briefly cover its appeal, pacing, art/story strengths, target reader, and any caveats.";
    const queryStr = `Hi! Review the series "${mangaTitle}" for me. ${detailsFocus} Also recommend 4 other premium title recommendations that match its exact vibe!`;
    handleSubmitPrompt(queryStr);
  };

  return (
    <div 
      id="gptsenpai-root-view" 
      className={`flex h-screen w-screen bg-[#212121] text-[#ececec] overflow-hidden font-sans ${
        designSettings.sidebarRight ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      
      {/* Toast feedback alerts with full-width flexbox centering wrapper */}
      {toast && (
        <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none select-none">
          <div 
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-neutral-900/95 border border-[#10a37f]/40 text-white font-sans text-xs tracking-wide font-medium shadow-[0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-lg toast-slide-down cursor-pointer max-w-[90vw] sm:max-w-md transition-all duration-300"
            onClick={() => setToast(null)}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#10a37f] flex-shrink-0 relative">
              <span className="absolute inset-0 rounded-full bg-[#10a37f] animate-ping opacity-75" />
            </div>
            <span className="text-gray-200 leading-relaxed text-center">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Drawer Collapsed trigger rail when sidebar is hidden */}
      {!isSidebarOpen && (
        <div className={`fixed top-3 z-40 flex items-center gap-2 ${designSettings.sidebarRight ? 'right-3' : 'left-3'}`}>
          <button
            id="expand-sidebar-btn"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-[#171717]/80 hover:bg-[#2f2f2f] border border-white/10 text-white/40 hover:text-white transition-colors cursor-pointer shadow-lg flex items-center justify-center"
            title="Expand sidebar"
          >
            {designSettings.sidebarRight ? <PanelRight className="w-4.5 h-4.5" /> : <PanelLeft className="w-4.5 h-4.5" />}
          </button>
        </div>
      )}

      {/* 1. Collapsible Sidebar Panel Container */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onClearHistory={handleClearHistory}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        onAskAIAboutManga={handleAskAIAboutManga}
        sidebarRight={designSettings.sidebarRight}
      />

      {/* 2. Main Workstation Area viewport */}
      <main className="flex-grow flex flex-col h-full bg-[#212121] min-w-0 relative">
        
        {/* Top Header Floating Nav bar */}
        <header id="main-header" className="py-3 sm:py-3.5 border-b border-white/5 px-4 flex items-center justify-between select-none bg-[#212121]/80 backdrop-blur-md flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            {/* Empty block to accommodate sidebar toggle overlay alignment nicely */}
            {!isSidebarOpen && !designSettings.sidebarRight && <div className="w-9" />}
            
            {/* Active chat name */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 font-sans text-xs font-semibold text-white/90 select-none max-w-[180px] sm:max-w-[300px] md:max-w-[400px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-pulse flex-shrink-0" />
              <span className="truncate">{activeChat ? activeChat.title : 'New Chat'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Themes Trigger Button */}
            <button
              id="design-lab-header-btn"
              onClick={() => setDesignLabOpen(true)}
              className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[#ececec] hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              title="Open Themes"
            >
              <Palette className="w-4 h-4 text-[#10a37f]" />
              <span className="hidden sm:inline">Themes</span>
            </button>

            {/* Quick action button mimicking mobile client shortcuts */}
            <button
              onClick={handleNewChat}
              className="p-2 text-white/40 hover:text-white hover:bg-[#2f2f2f] rounded-lg transition-colors cursor-pointer md:hidden"
              title="New Conversation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 3. Messages & Interactive Database Split panels viewport */}
        <div className="flex-grow flex overflow-hidden w-full relative">
          
          {/* Main Chat Workspace Column */}
          <div className="flex-grow flex flex-col h-full relative min-w-0">
            {/* Scrollable messages log viewport */}
            <div className="flex-grow flex flex-col overflow-y-auto w-full relative">
              <MessageList
                key={activeChatId || 'empty'}
                messages={activeChat ? activeChat.messages : []}
                isGenerating={isGenerating}
                onSelectSuggestion={handleSelectSuggestionCard}
                onAskAIAboutManga={handleAskAIAboutManga}
              />
            </div>

            {/* Custom bottom active input controller */}
            <div className="flex-shrink-0 w-full bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-4">
              <ChatInput
                inputText={inputText}
                setInputText={setInputText}
                onSubmit={() => handleSubmitPrompt()}
                isGenerating={isGenerating}
                webSearch={webSearch}
                setWebSearch={setWebSearch}
                attachment={attachment}
                setAttachment={setAttachment}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal controller */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        userName={userName}
        onUpdateUserName={handleUpdateUserName}
        onClearAll={handleClearHistory}
        totalChats={chats.length}
      />

      {/* Interactive Themes Workspace */}
      <DesignLabModal
        isOpen={isDesignLabOpen}
        onClose={() => setDesignLabOpen(false)}
        settings={designSettings}
        onUpdateSettings={setDesignSettings}
      />
    </div>
  );
}
