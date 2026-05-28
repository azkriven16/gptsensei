import React from 'react';
import { 
  X, 
  RotateCcw, 
  Type, 
  Sparkles, 
  Check, 
  Layers, 
  Columns, 
  Settings, 
  SlidersHorizontal 
} from 'lucide-react';
import { DesignSettings, DEFAULT_DESIGN_SETTINGS } from '../types';

interface DesignLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DesignSettings;
  onUpdateSettings: (settings: DesignSettings) => void;
}

export default function DesignLabModal({ isOpen, onClose, settings, onUpdateSettings }: DesignLabModalProps) {
  if (!isOpen) return null;

  const fontSansOptions = [
    { id: 'inter', name: 'Inter UI', family: 'Inter, sans-serif', desc: 'Default clean sans-serif' },
    { id: 'space-grotesk', name: 'Space Grotesk', family: 'Space Grotesk, sans-serif', desc: 'Tech-forward display geometric' },
    { id: 'outfit', name: 'Outfit', family: 'Outfit, sans-serif', desc: 'Sleek, rounded modern' },
    { id: 'playfair', name: 'Playfair Display', family: 'Playfair Display, serif', desc: 'Sophisticated editorial serif' }
  ] as const;

  const fontMonoOptions = [
    { id: 'jetbrains-mono', name: 'JetBrains Mono', family: 'JetBrains Mono, monospace' },
    { id: 'fira-code', name: 'Fira Code', family: 'Fira Code, monospace' },
    { id: 'source-code', name: 'Source Code Pro', family: 'Source Code Pro, monospace' }
  ] as const;

  const fontSizeOptions = [
    { id: 'sm', name: 'Compact', size: '13px', desc: 'Reduced text sizes for maximizing data density' },
    { id: 'md', name: 'Standard', size: '15px', desc: 'The balanced default GPTSenpai scale' },
    { id: 'lg', name: 'Generous', size: '17px', desc: 'Comfortable oversized reading view' }
  ] as const;

  const accentColorOptions = [
    { id: 'teal', name: 'GPTSenpai Emerald', hex: '#10a37f', hoverHex: '#0d8a6a' },
    { id: 'indigo', name: 'Royal Indigo', hex: '#6366f1', hoverHex: '#4f46e5' },
    { id: 'rose', name: 'Velvet Rose', hex: '#f43f5e', hoverHex: '#e11d48' },
    { id: 'amber', name: 'Warm Amber', hex: '#f59e0b', hoverHex: '#d97706' },
    { id: 'sky', name: 'Electric Sky', hex: '#0ea5e9', hoverHex: '#0284c7' }
  ] as const;

  const borderRadiusOptions = [
    { id: 'none', name: 'Sharp Angle', css: '0px', desc: 'Brutalist retro rects' },
    { id: 'md', name: 'Classic (6px)', css: '6px', desc: 'Muted modern roundedness' },
    { id: 'xl', name: 'Dynamic (12px)', css: '12px', desc: 'The elegant curves aesthetic' },
    { id: 'full', name: 'Pill-Super (24px)', css: '24px', desc: 'High fluid rounded capsule bubbles' }
  ] as const;

  const surfaceMoodOptions = [
    { 
      id: 'midnight', 
      name: 'Cosmic Midnight', 
      sidebar: '#171717', 
      main: '#212121', 
      card: '#2f2f2f', 
      desc: 'Elegant deeply muted dark charcoal default wrapper',
      sidebarRgb: '23,23,23',
      cardRgb: '47,47,47'
    },
    { 
      id: 'jet-black', 
      name: 'Absolute Jet Black', 
      sidebar: '#000000', 
      main: '#090909', 
      card: '#161616', 
      desc: 'High contrast organic look for OLED displays',
      sidebarRgb: '0,0,0',
      cardRgb: '22,22,22'
    },
    { 
      id: 'warm-coffee', 
      name: 'Barista Espresso', 
      sidebar: '#181413', 
      main: '#231e1d', 
      card: '#2e2726', 
      desc: 'Eye-friendly sepia-undertone brown chocolate theme',
      sidebarRgb: '24,20,19',
      cardRgb: '46,39,38'
    },
    { 
      id: 'cyberpunk', 
      name: 'Synthwave Neon Noir', 
      sidebar: '#0a0514', 
      main: '#120b22', 
      card: '#1f1435', 
      desc: 'Immersive electric purple cyberpunk lounge',
      sidebarRgb: '10,5,20',
      cardRgb: '31,20,53'
    }
  ] as const;

  // Handler to mutate state and save
  const updateField = <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  const currentAccent = accentColorOptions.find(o => o.id === settings.accentColor) || accentColorOptions[0];
  const currentMood = surfaceMoodOptions.find(o => o.id === settings.surfaceMood) || surfaceMoodOptions[0];
  const currentRadius = borderRadiusOptions.find(o => o.id === settings.borderRadius) || borderRadiusOptions[2];
  const currentSans = fontSansOptions.find(o => o.id === settings.fontSans) || fontSansOptions[0];

  return (
    <div 
      id="design-lab-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="design-lab-dialog"
        className="w-full max-w-[850px] bg-[#2f2f2f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[650px] text-left"
        style={{ 
          fontFamily: currentSans.family,
          backgroundColor: currentMood.card
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Side: Customize Deck controls */}
        <div className="flex-1 flex flex-col h-1/2 md:h-full overflow-y-auto border-r border-white/5 bg-black/15 p-5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4.5 h-4.5" style={{ color: currentAccent.hex }} />
              <h2 className="text-sm font-bold tracking-wider uppercase text-white/90">Themes</h2>
            </div>
            <button 
              onClick={() => onUpdateSettings(DEFAULT_DESIGN_SETTINGS)}
              className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[11px] font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Reset all options"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Template</span>
            </button>
          </div>

          {/* Theme Surface Mood Selector */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Aesthetic Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              {surfaceMoodOptions.map((mood) => {
                const isSelected = settings.surfaceMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => updateField('surfaceMood', mood.id)}
                    className={`p-2.5 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-white/20 bg-white/5 shadow-inner' 
                        : 'border-white/5 bg-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-3.5 w-7 rounded overflow-hidden border border-white/10 shrink-0">
                        <div className="w-1/3" style={{ backgroundColor: mood.sidebar }} />
                        <div className="w-2/3" style={{ backgroundColor: mood.main }} />
                      </div>
                      <span className="text-xs font-semibold text-white/95 truncate">{mood.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Accent Picker */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Color Accent</h3>
            <div className="flex items-center gap-3">
              {accentColorOptions.map((accent) => {
                const isSelected = settings.accentColor === accent.id;
                return (
                  <button
                    key={accent.id}
                    onClick={() => updateField('accentColor', accent.id)}
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer border ${
                      isSelected ? 'border-white scale-105 shadow-md' : 'border-black/20'
                    }`}
                    style={{ backgroundColor: accent.hex }}
                    title={accent.name}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-white stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Custom Fonts Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Typography Family (Sans)</h3>
              <div className="grid grid-cols-2 gap-2">
                {fontSansOptions.map((f) => {
                  const isSelected = settings.fontSans === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => updateField('fontSans', f.id)}
                      className={`p-2 rounded-xl text-left border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-white/20 bg-white/5' 
                          : 'border-white/5 bg-transparent hover:bg-white/5'
                      }`}
                      style={{ fontFamily: f.family }}
                    >
                      <div className="text-xs font-semibold text-white/95 truncate">{f.name}</div>
                      <div className="text-[9px] text-white/30 truncate">Aa Bb Cc Dd</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Typography Code Family (Mono)</h3>
              <div className="grid grid-cols-2 gap-2">
                {fontMonoOptions.map((f) => {
                  const isSelected = settings.fontMono === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => updateField('fontMono', f.id)}
                      className={`p-1.5 px-2 rounded-lg text-left border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-white/20 bg-white/5' 
                          : 'border-white/5 bg-transparent hover:bg-white/5'
                      }`}
                      style={{ fontFamily: f.family }}
                    >
                      <div className="text-[11px] font-medium text-white/90 truncate">{f.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Font Sizes Selectors */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Interface Reading Size</h3>
            <div className="grid grid-cols-3 gap-2">
              {fontSizeOptions.map((sz) => {
                const isSelected = settings.fontSize === sz.id;
                return (
                  <button
                    key={sz.id}
                    onClick={() => updateField('fontSize', sz.id)}
                    className={`p-2 rounded-xl text-center border cursor-pointer flex flex-col items-center justify-center transition-colors ${
                      isSelected 
                        ? 'border-white/20 bg-white/5' 
                        : 'border-white/5 bg-transparent hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs font-bold text-white/90">{sz.name}</span>
                    <span className="text-[10px] text-white/30 mt-0.5">{sz.size}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Borders Corner Style */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Borders & Rounded Angles</h3>
            <div className="grid grid-cols-2 gap-2">
              {borderRadiusOptions.map((rad) => {
                const isSelected = settings.borderRadius === rad.id;
                return (
                  <button
                    key={rad.id}
                    onClick={() => updateField('borderRadius', rad.id)}
                    className={`p-2 rounded-xl text-left border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-white/20 bg-white/5' 
                        : 'border-white/5 bg-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-white/30" style={{ borderRadius: rad.css }} />
                      <span className="text-xs font-semibold text-white/90 truncate">{rad.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Layout Alignment Switch */}
          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Interface Column Layout</h3>
            <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5">
              <div className="leading-tight">
                <span className="text-xs font-semibold text-white/95 block">Reverse Sidebar Layout</span>
                <span className="text-[10px] text-white/40 block">Align history sidebar panel to the right</span>
              </div>
              <button
                type="button"
                onClick={() => updateField('sidebarRight', !settings.sidebarRight)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${
                  settings.sidebarRight ? 'bg-indigo-500' : 'bg-white/10'
                }`}
                style={{ backgroundColor: settings.sidebarRight ? currentAccent.hex : undefined }}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 mt-0.5 ${
                    settings.sidebarRight ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Preview Canvas */}
        <div className="flex-1 flex flex-col h-1/2 md:h-full p-6 justify-between select-none relative bg-black/5 flex-shrink-0">
          
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1.5 bg-black/25 hover:bg-black/50 hover:text-white rounded-full text-white/60 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-white/40 tracking-wider font-semibold uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" style={{ color: currentAccent.hex }} />
              <span>Interactive Live Preview</span>
            </div>
            
            <div className="space-y-4">
              {/* Fake User bubble */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold select-none shrink-0 shadow-sm">
                  JD
                </div>
                <div 
                  className="bg-white/5 border border-white/5 p-2.5 max-w-[85%] leading-relaxed text-[13px] text-white/90"
                  style={{ 
                    borderRadius: currentRadius.css,
                    fontSize: settings.fontSize === 'sm' ? '12px' : settings.fontSize === 'md' ? '13px' : '14px'
                  }}
                >
                  Can you show me how my custom design changes affect bubble styles?
                </div>
              </div>

              {/* Fake Assistant bubble */}
              <div className="flex items-start gap-2.5">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow animate-fade-in"
                  style={{ backgroundColor: currentAccent.hex }}
                >
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="flex-1 space-y-2">
                  <div 
                    className="bg-white/10 border border-white/5 p-3 leading-relaxed text-[13px] text-white/95"
                    style={{ 
                      borderRadius: currentRadius.css,
                      fontSize: settings.fontSize === 'sm' ? '12px' : settings.fontSize === 'md' ? '13px' : '14px'
                    }}
                  >
                    Absolutely! Try clicking other themes, color points, fonts, and layouts to see everything update instantly!
                  </div>
                  <div className="flex items-center gap-1">
                    <div 
                      className="px-2 py-0.5 rounded text-[10px] border font-semibold inline-block"
                      style={{ 
                        color: currentAccent.hex, 
                        borderColor: `${currentAccent.hex}33`,
                        backgroundColor: `${currentAccent.hex}15`,
                        borderRadius: `calc(${currentRadius.css} / 2)`
                      }}
                    >
                      Dynamic badge
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <button
              onClick={onClose}
              className="w-full text-center py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase shadow-xl transition-transform active:scale-95 text-[#171717] hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: currentAccent.hex }}
            >
              Apply lab selections
            </button>
            <div className="text-[10px] text-white/30 text-center mt-2 font-normal leading-normal">
              Any choices are cached locally and preserved across browser sessions.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
