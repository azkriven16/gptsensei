/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowUp, 
  Globe, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  Mic, 
  MicOff,
  CircleStop
} from 'lucide-react';

interface ChatInputProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e?: React.FormEvent) => void;
  isGenerating: boolean;
  webSearch: boolean;
  setWebSearch: (search: boolean) => void;
  attachment: { name: string; type: string; data: string } | null;
  setAttachment: (attachment: { name: string; type: string; data: string } | null) => void;
}

export default function ChatInput({
  inputText,
  setInputText,
  onSubmit,
  isGenerating,
  webSearch,
  setWebSearch,
  attachment,
  setAttachment,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any | null>(null);

  // Resize textarea on content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 210)}px`;
    }
  }, [inputText]);

  // Handle voice speech recognition initialization (for premium voice indicator details)
  useEffect(() => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechAPI) {
      const rec = new SpeechAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [setInputText]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && (inputText.trim() || attachment)) {
        onSubmit();
        // Reset height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    
    const reader = new FileReader();
    reader.onload = () => {
      const resultData = reader.result as string;
      const base64Data = resultData.split(',')[1] || '';

      setAttachment({
        name: file.name,
        type: fileType,
        data: base64Data,
      });

      // Reset value so same file can be clicked again
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleVoiceInput = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  const canSubmit = inputText.trim() || attachment;

  return (
    <div className="w-full flex flex-col items-center px-2 sm:px-0 max-w-[760px] mx-auto pb-2 sm:pb-4 pt-1 font-sans">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit && !isGenerating) onSubmit();
        }}
        className="w-full relative flex flex-col bg-[#2f2f2f] border border-white/10 rounded-2xl sm:rounded-3xl p-0.5 sm:p-1.5 focus-within:border-[#10a37f]/50 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all overflow-hidden"
      >
        {/* Attachment preview bar inside the bubble card if active */}
        {attachment && (
          <div className="flex items-center gap-2 p-1.5 mx-2.5 mt-2 mb-1 bg-[#171717]/50 border border-white/5 rounded-xl relative max-w-[240px] transition-all animate-fade-in text-left">
            <div className="p-1 bg-[#171717]/80 rounded text-teal-400 border border-white/5 flex-shrink-0 flex items-center justify-center">
              {attachment.type.startsWith('image/') ? (
                <img 
                  src={`data:${attachment.type};base64,${attachment.data}`} 
                  alt={attachment.name} 
                  className="w-6 h-6 rounded object-cover"
                />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-[#10a37f]" />
              )}
            </div>
            
            <div className="min-w-0 flex-grow text-left leading-tight pr-5">
              <div className="text-[11px] font-semibold text-white/95 truncate">{attachment.name}</div>
              <div className="text-[9px] text-white/40 uppercase truncate">
                {attachment.type.split('/')[1] || 'Media'}
              </div>
            </div>

            <button
               type="button"
               onClick={removeAttachment}
               className="absolute top-1 right-1 p-0.5 hover:text-white rounded text-white/40 hover:bg-[#3e3e3e] transition cursor-pointer"
               title="Remove attachment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center pl-2 sm:pl-3">
          {/* Paperclip upload trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1 sm:p-2 bg-transparent hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer flex-shrink-0 select-none shadow-sm"
            title="Attach images"
          >
            <Paperclip className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />

          {/* Actual textarea prompt */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Message GPTSenpai..."
            className="flex-grow bg-transparent font-sans text-xs sm:text-[14px] md:text-[15px] font-normal leading-tight text-white max-h-[140px] sm:max-h-[210px] min-h-[22px] sm:min-h-[30px] py-1.5 sm:py-2 px-1.5 sm:px-2.5 focus:outline-none resize-none align-middle placeholder-white/30"
            style={{ height: 'auto' }}
          />

          {/* Actions panel aligning right */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 pr-1.5 sm:pr-2 select-none flex-shrink-0">
            {/* Audio Voice mic toggle */}
            {recognition && (
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-1 sm:p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                  isListening 
                  ? 'bg-rose-500/20 text-rose-500 animate-pulse' 
                  : 'bg-transparent text-white/40 hover:text-white hover:bg-white/5'
                }`}
                title={isListening ? "Listening... click to stop" : "Voice message dictation"}
              >
                {isListening ? <CircleStop className="w-3.5 h-3.5 sm:w-5 sm:h-5 animate-pulse" /> : <Mic className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
              </button>
            )}

            {/* Google Search Toggle */}
            <button
              type="button"
              onClick={() => setWebSearch(!webSearch)}
              className={`p-1 sm:p-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer select-none border border-transparent ${
                webSearch 
                  ? 'bg-[#10a37f]/20 text-[#10a37f] font-semibold border-[#10a37f]/30' 
                  : 'bg-transparent text-white/40 hover:text-white hover:bg-white/5'
              }`}
              title={webSearch ? "Search Grounding Active" : "Toggle Search on Web"}
            >
              <Globe className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
              {webSearch && <span className="text-[8px] sm:text-[10px] pr-0.5 uppercase tracking-wider font-sans font-bold hidden xs:inline">Search</span>}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!canSubmit || isGenerating}
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 ${
                canSubmit && !isGenerating
                  ? 'bg-white text-[#171717] hover:bg-white/90 scale-[1.03] shadow'
                  : 'bg-white/10 text-white/30 hover:bg-white/5'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </form>

      {/* Underline helper disclaimer */}
      <div className="text-[10px] sm:text-[11px] text-white/40 text-center tracking-normal font-sans font-normal mt-1 sm:mt-2">
        GPTSenpai can make mistakes. Check important info.
      </div>
    </div>
  );
}
