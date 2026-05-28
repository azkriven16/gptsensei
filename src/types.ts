/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CodeSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  attachmentName?: string;
  attachmentData?: string; // base64 encoded media if any
  attachmentType?: string; // e.g., 'image/png' or 'text/plain'
  searchSources?: CodeSource[]; // real web search grounding search citations
  isError?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: string;
  webSearch: boolean;
}

export interface DesignSettings {
  fontSans: 'inter' | 'space-grotesk' | 'outfit' | 'playfair';
  fontMono: 'jetbrains-mono' | 'fira-code' | 'source-code';
  fontSize: 'sm' | 'md' | 'lg';
  accentColor: 'teal' | 'indigo' | 'rose' | 'amber' | 'sky';
  borderRadius: 'none' | 'md' | 'xl' | 'full';
  surfaceMood: 'midnight' | 'jet-black' | 'warm-coffee' | 'cyberpunk';
  sidebarRight: boolean;
}

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  fontSans: 'inter',
  fontMono: 'jetbrains-mono',
  fontSize: 'md',
  accentColor: 'teal',
  borderRadius: 'xl',
  surfaceMood: 'midnight',
  sidebarRight: false,
};
