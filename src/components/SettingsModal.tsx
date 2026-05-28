/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Settings, ShieldAlert, BadgeCheck, Sparkles, Volume2, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
  onClearAll: () => void;
  totalChats: number;
}

export default function SettingsModal({
  isOpen,
  onClose,
  userName,
  onUpdateUserName,
  onClearAll,
  totalChats,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      id="settings-modal-backdrop" 
      className="fixed inset-0 bg-[#000000]/70 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="settings-dialog"
        className="w-full max-w-[500px] bg-[#2f2f2f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header section */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#212121]/30">
          <div className="flex items-center gap-2.5 text-white">
            <Settings className="w-4.5 h-4.5 text-[#10a37f]" />
            <h2 className="text-base font-bold tracking-tight text-white/90">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#3e3e3e] rounded-lg text-white/40 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Section 1: User customization */}
          <div className="space-y-3.5">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">User Profile</h3>
            <div className="space-y-2">
              <label className="text-[12px] text-white/90 block">Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => onUpdateUserName(e.target.value.substring(0, 16))}
                placeholder="Type profile nickname..."
                className="w-full bg-[#171717] text-white border border-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#10a37f]/50 transition"
              />
              <span className="text-[10px] text-white/40 block leading-normal mt-1">
                Your initials are rendered inside user-aligned chat bubble avatars.
              </span>
            </div>
          </div>

          {/* Section 2: Environment configuration status */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">About</h3>
            
            <div className="bg-[#171717]/80 rounded-xl p-3.5 border border-white/5 space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Model Engine</span>
                <span className="text-white/90 font-semibold flex items-center gap-1">
                  <BadgeCheck className="w-4.5 h-4.5 text-[#10a37f]" /> Gemini Platform
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Client Status</span>
                <span className="text-white/90 font-medium">Auto-Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Active conversations</span>
                <span className="text-white/90 font-medium font-mono">{totalChats} sessions</span>
              </div>
            </div>
          </div>

          {/* Section 3: TTS info */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Voice Reading</h3>
            <div className="flex items-center gap-3 bg-[#171717]/30 p-3 rounded-xl border border-white/5">
              <Volume2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div className="text-[12px] text-white/40 leading-tight">
                <span className="font-semibold text-white/90 block">HTML5 Audio Synthesis</span>
                We use local speech synthesis engines so there is zero network readout lag.
              </div>
            </div>
          </div>

          {/* Section 4: Severe actions */}
          <div className="pt-5 border-t border-white/5 space-y-3">
            <h3 className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h3>
            <button
              onClick={() => {
                const confirmed = window.confirm("Are you absolutely sure you want to clear your local chat history? This action is permanent and cannot be undone.");
                if (confirmed) {
                  onClearAll();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/15 hover:border-transparent text-rose-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete all chats</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
