import { CaptionStyle, PresetId, WhisperLanguage } from '../types/caption';

export interface StylePresetItem {
  id: PresetId;
  name: string;
  description: string;
  previewBg: string;
  style: Partial<CaptionStyle>;
}

export const CAPCUT_PRESETS: StylePresetItem[] = [
  {
    id: 'capcut_classic',
    name: 'Clean Minimalist',
    description: 'Crisp white typography with ultra-thin subtle outline & warm pop',
    previewBg: 'bg-zinc-900',
    style: {
      presetId: 'capcut_classic',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 44,
      fillColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 1.5,
      shadowColor: 'rgba(0, 0, 0, 0.45)',
      shadowBlur: 3,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      boxEnabled: false,
      boxColor: 'rgba(0, 0, 0, 0.55)',
      boxPaddingVertical: 6,
      boxPaddingHorizontal: 16,
      boxRadius: 8,
      position: 'bottom',
      uppercase: false,
      wordPopEnabled: true,
      highlightColor: '#FACC15', // Modern clean yellow
    }
  },
  {
    id: 'minimal_box',
    name: 'Translucent Glass Box',
    description: 'Minimal dark rounded capsule with zero outline & clean contrast',
    previewBg: 'bg-zinc-950',
    style: {
      presetId: 'minimal_box',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: 40,
      fillColor: '#FFFFFF',
      outlineColor: 'transparent',
      outlineWidth: 0,
      shadowColor: 'rgba(0, 0, 0, 0.25)',
      shadowBlur: 3,
      shadowOffsetX: 0,
      shadowOffsetY: 1,
      boxEnabled: true,
      boxColor: 'rgba(12, 12, 18, 0.65)',
      boxPaddingVertical: 6,
      boxPaddingHorizontal: 16,
      boxRadius: 8,
      position: 'bottom',
      uppercase: false,
      wordPopEnabled: true,
      highlightColor: '#38BDF8', // Soft sky blue pop
    }
  },
  {
    id: 'tiktok_yellow',
    name: 'Modern Creator Yellow',
    description: 'Clean creator font with subtle 1.5px stroke & vibrant yellow pop',
    previewBg: 'bg-slate-900',
    style: {
      presetId: 'tiktok_yellow',
      fontFamily: '"Outfit", sans-serif',
      fontSize: 46,
      fillColor: '#FFFFFF',
      outlineColor: '#0A0A0F',
      outlineWidth: 1.5,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 4,
      shadowOffsetX: 1,
      shadowOffsetY: 2,
      boxEnabled: false,
      boxColor: 'rgba(0, 0, 0, 0.6)',
      position: 'bottom',
      uppercase: true,
      wordPopEnabled: true,
      highlightColor: '#FBBF24', // Warm amber gold
    }
  },
  {
    id: 'cinematic_serif',
    name: 'Editorial Serif',
    description: 'Subtle documentary serif with delicate 1px shadow & off-white ivory',
    previewBg: 'bg-stone-950',
    style: {
      presetId: 'cinematic_serif',
      fontFamily: 'Playfair Display, Georgia, serif',
      fontSize: 42,
      fillColor: '#FDFBF7',
      outlineColor: 'rgba(0, 0, 0, 0.7)',
      outlineWidth: 1.0,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowBlur: 3,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      boxEnabled: false,
      boxColor: 'rgba(0, 0, 0, 0.4)',
      position: 'bottom',
      uppercase: false,
      wordPopEnabled: true,
      highlightColor: '#F59E0B',
    }
  },
  {
    id: 'neon_cyber',
    name: 'Soft Ambient Glow',
    description: 'Minimal modern sans with refined ambient cyan glow & crisp text',
    previewBg: 'bg-neutral-950',
    style: {
      presetId: 'neon_cyber',
      fontFamily: '"Urbanist", sans-serif',
      fontSize: 44,
      fillColor: '#FFFFFF',
      outlineColor: 'rgba(10, 10, 20, 0.8)',
      outlineWidth: 1.0,
      shadowColor: 'rgba(56, 189, 248, 0.6)',
      shadowBlur: 5,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      boxEnabled: false,
      boxColor: 'rgba(10, 10, 20, 0.7)',
      position: 'bottom',
      uppercase: false,
      wordPopEnabled: true,
      highlightColor: '#38BDF8',
    }
  },
  {
    id: 'karaoke_wave',
    name: 'Sleek Rhythm Pop',
    description: 'Modern clean sans with delicate 1.5px stroke & soft rose pop',
    previewBg: 'bg-neutral-900',
    style: {
      presetId: 'karaoke_wave',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: 44,
      fillColor: '#F8FAFC',
      outlineColor: '#0F172A',
      outlineWidth: 1.5,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 4,
      shadowOffsetX: 1,
      shadowOffsetY: 2,
      boxEnabled: false,
      boxColor: 'rgba(15, 23, 42, 0.6)',
      position: 'bottom',
      uppercase: false,
      wordPopEnabled: true,
      highlightColor: '#F43F5E',
    }
  }
];

export const DEFAULT_STYLE: CaptionStyle = {
  ...CAPCUT_PRESETS[0].style,
  wordsPerCaption: 3
} as CaptionStyle;

export const SUPPORTED_LANGUAGES: WhisperLanguage[] = [
  { code: 'auto', name: 'Auto-detect Language' },
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Swahili (Kiswahili) - Kiswahili Sanifu' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'tr', name: 'Turkish (Türkçe)' },
  { code: 'pl', name: 'Polish (Polski)' },
  { code: 'uk', name: 'Ukrainian (Українська)' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
  { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
];

export const WHISPER_MODELS = [
  { id: 'tiny', name: 'Tiny (39M) - Ultra Fast (English only)', memory: '~1 GB VRAM / RAM' },
  { id: 'base', name: 'Base (74M) - Fast', memory: '~1 GB RAM' },
  { id: 'small', name: 'Small (244M) - Balanced (Recommended for Swahili & Multilingual)', memory: '~2 GB RAM' },
  { id: 'medium', name: 'Medium (769M) - High Accuracy (Best for Swahili Grammar)', memory: '~4 GB RAM' },
  { id: 'large-v3', name: 'Large-v3 (1550M) - Studio Quality', memory: '~10 GB RAM' }
];

export const BUNDLED_FONTS = [
  { label: 'Plus Jakarta Sans (Modern Clean)', family: 'Plus Jakarta Sans' },
  { label: 'Outfit (Creator Display)', family: 'Outfit' },
  { label: 'Montserrat (Refined Geometric)', family: 'Montserrat' },
  { label: 'Urbanist (Clean Tech)', family: 'Urbanist' },
  { label: 'Playfair Display (Editorial Serif)', family: 'Playfair Display' }
];

export const COMMON_SYSTEM_FONTS = [
  'Arial',
  'Calibri',
  'Franklin Gothic Medium',
  'Georgia',
  'Helvetica',
  'Inter',
  'Palatino Linotype',
  'Poppins',
  'Roboto',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana'
];
