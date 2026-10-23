import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Upload, 
  Check, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  FolderPlus,
  X,
  Type,
  Plus
} from 'lucide-react';
import { BUNDLED_FONTS, COMMON_SYSTEM_FONTS } from '../utils/presetStyles';

interface FontPickerProps {
  currentFont: string;
  onSelectFont: (fontFamily: string) => void;
  showToast?: (message: string) => void;
}

const RECENT_FONTS_KEY = 'pcut_recent_fonts';
const CUSTOM_FONTS_KEY = 'pcut_custom_font_names';

export const FontPicker: React.FC<FontPickerProps> = ({
  currentFont,
  onSelectFont,
  showToast
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFontInput, setNewFontInput] = useState('');
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [importedFonts, setImportedFonts] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_FONTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [recentFonts, setRecentFonts] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_FONTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean primary family name from css string (e.g. '"Outfit", sans-serif' -> 'Outfit')
  const cleanCurrentFamily = useMemo(() => {
    return currentFont.split(',')[0].replace(/['"]/g, '').trim();
  }, [currentFont]);

  // Load system fonts and user fonts on mount
  useEffect(() => {
    const loadFonts = async () => {
      const electronApi = (window as any).electronAPI || (window as any).api;

      // 1. In Electron
      if (electronApi?.getSystemFonts) {
        try {
          const fonts: string[] = await electronApi.getSystemFonts();
          if (fonts && fonts.length > 0) {
            setSystemFonts(fonts);
          } else {
            setSystemFonts(COMMON_SYSTEM_FONTS);
          }
        } catch (e) {
          console.warn('[FontPicker] Could not fetch system fonts via IPC:', e);
          setSystemFonts(COMMON_SYSTEM_FONTS);
        }

        if (electronApi?.getUserFonts) {
          try {
            const userF: Array<{ family: string }> = await electronApi.getUserFonts();
            if (userF && userF.length > 0) {
              setImportedFonts(prev => Array.from(new Set([...userF.map(f => f.family), ...prev])));
            }
          } catch (e) {
            console.warn('[FontPicker] Could not fetch user fonts:', e);
          }
        }
      } 
      // 2. In Browser
      else {
        // Try modern Local Font Access API if available in Chromium
        if ('queryLocalFonts' in window) {
          try {
            const local = await (window as any).queryLocalFonts();
            const names = Array.from(new Set(local.map((f: any) => f.family))) as string[];
            if (names.length > 0) {
              setSystemFonts(names.sort((a, b) => a.localeCompare(b)));
            } else {
              setSystemFonts(COMMON_SYSTEM_FONTS);
            }
          } catch {
            setSystemFonts(COMMON_SYSTEM_FONTS);
          }
        } else {
          setSystemFonts(COMMON_SYSTEM_FONTS);
        }
      }
    };

    loadFonts();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle font selection
  const handleSelect = (family: string) => {
    const cleaned = family.replace(/['"]/g, '').trim();
    if (!cleaned) return;
    onSelectFont(cleaned);

    // Update recent fonts
    setRecentFonts(prev => {
      const next = [cleaned, ...prev.filter(f => f.toLowerCase() !== cleaned.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    setIsOpen(false);
    showToast?.(`Font set to ${cleaned}`);
  };

  // Add font manually by family name
  const handleAddCustomFontName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFontInput.trim().replace(/['"]/g, '');
    if (!trimmed) return;

    setImportedFonts(prev => {
      const updated = Array.from(new Set([trimmed, ...prev]));
      try {
        localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    handleSelect(trimmed);
    setNewFontInput('');
    showToast?.(`Added and applied custom font: "${trimmed}"`);
  };

  // Import font file (.ttf, .otf, .woff, .woff2)
  const handleImportFontClick = async () => {
    const electronApi = (window as any).electronAPI || (window as any).api;

    // Electron desktop workflow
    if (electronApi?.importFontFile) {
      try {
        const result = await electronApi.importFontFile();
        if (result && result.success && result.family) {
          setImportedFonts(prev => {
            const next = Array.from(new Set([result.family, ...prev]));
            try { localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next)); } catch {}
            return next;
          });
          handleSelect(result.family);
          showToast?.(`Imported font "${result.family}" successfully!`);
          return;
        }
      } catch (err: any) {
        console.warn('[FontPicker Electron Import Notice]:', err.message);
      }
    }

    // Browser fallback workflow using Web FontFace API
    fileInputRef.current?.click();
  };

  const handleBrowserFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawName = file.name.replace(/\.[^/.]+$/, '').trim();
      const sanitizedName = rawName.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'CustomFont';
      const arrayBuffer = await file.arrayBuffer();

      const fontFace = new FontFace(sanitizedName, arrayBuffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      setImportedFonts(prev => {
        const next = Array.from(new Set([sanitizedName, ...prev]));
        try {
          localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      handleSelect(sanitizedName);
      showToast?.(`Loaded font file "${sanitizedName}" successfully!`);
    } catch (err: any) {
      showToast?.(`Could not load font file: ${err.message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Filtered lists
  const query = searchQuery.toLowerCase().trim();

  const filteredBundled = useMemo(() => {
    return BUNDLED_FONTS.filter(f => 
      f.family.toLowerCase().includes(query) || f.label.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredRecent = useMemo(() => {
    return recentFonts.filter(f => f.toLowerCase().includes(query));
  }, [recentFonts, query]);

  const filteredImported = useMemo(() => {
    return importedFonts.filter(f => f.toLowerCase().includes(query));
  }, [importedFonts, query]);

  const filteredSystem = useMemo(() => {
    const bundledNames = new Set(BUNDLED_FONTS.map(b => b.family.toLowerCase()));
    return systemFonts.filter(f => {
      const lower = f.toLowerCase();
      if (bundledNames.has(lower)) return false;
      return lower.includes(query);
    });
  }, [systemFonts, query]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Hidden file input for web font import (supports both lower and upper case extensions) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2,.TTF,.OTF,.WOFF,.WOFF2,font/*"
        className="hidden"
        onChange={handleBrowserFileChange}
      />

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-left flex items-center justify-between text-xs transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Type className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span 
            className="text-zinc-200 font-semibold truncate text-[13px]"
            style={{ fontFamily: cleanCurrentFamily }}
          >
            {cleanCurrentFamily}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded">
            Choose
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#16161f] border border-zinc-700/80 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[420px]">
          {/* Header & Search Bar */}
          <div className="p-2.5 border-b border-zinc-800 space-y-2 bg-[#191924]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fonts (e.g. Arial, Inter, Outfit)..."
                className="w-full pl-8 pr-7 py-1.5 bg-zinc-900/90 text-zinc-100 text-xs rounded-lg border border-zinc-700/60 focus:outline-none focus:border-indigo-500 placeholder-zinc-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom Font Actions (File Upload + Type Name) */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={handleImportFontClick}
                className="w-full py-1.5 px-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Import Font File (.ttf, .otf, .woff)</span>
              </button>

              {/* Add Font by Name Input */}
              <form onSubmit={handleAddCustomFontName} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newFontInput}
                  onChange={(e) => setNewFontInput(e.target.value)}
                  placeholder="Or type font name (e.g. Poppins)..."
                  className="flex-1 px-2.5 py-1 bg-zinc-900 text-zinc-200 text-xs rounded-lg border border-zinc-700/60 focus:outline-none focus:border-indigo-500 placeholder-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!newFontInput.trim()}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>

          {/* Scrollable Font List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar text-xs">
            {/* 1. Recently Used Section */}
            {!query && filteredRecent.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>Recently Used</span>
                </div>
                <div className="space-y-0.5">
                  {filteredRecent.map((fam) => {
                    const isSelected = fam.toLowerCase() === cleanCurrentFamily.toLowerCase();
                    return (
                      <button
                        key={`recent_${fam}`}
                        type="button"
                        onClick={() => handleSelect(fam)}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-300 hover:bg-zinc-800/80'
                        }`}
                      >
                        <span style={{ fontFamily: fam }} className="text-[13px] truncate">
                          {fam}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Bundled Modern Minimal Fonts */}
            {filteredBundled.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-2 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Curated Clean Fonts</span>
                </div>
                <div className="space-y-0.5">
                  {filteredBundled.map((bf) => {
                    const isSelected = bf.family.toLowerCase() === cleanCurrentFamily.toLowerCase();
                    return (
                      <button
                        key={`bundled_${bf.family}`}
                        type="button"
                        onClick={() => handleSelect(bf.family)}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-200 hover:bg-zinc-800/80'
                        }`}
                      >
                        <div className="truncate flex items-center gap-2">
                          <span style={{ fontFamily: bf.family }} className="text-[13px]">
                            {bf.family}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-sans font-normal">
                            ({bf.label.split('(')[1]?.replace(')', '') || 'Preset'})
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. User Imported / Added Custom Fonts */}
            {filteredImported.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 mb-1 flex items-center gap-1">
                  <Upload className="w-3 h-3 text-emerald-400" />
                  <span>Custom & Imported Fonts ({filteredImported.length})</span>
                </div>
                <div className="space-y-0.5">
                  {filteredImported.map((fam) => {
                    const isSelected = fam.toLowerCase() === cleanCurrentFamily.toLowerCase();
                    return (
                      <button
                        key={`imported_${fam}`}
                        type="button"
                        onClick={() => handleSelect(fam)}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-300 hover:bg-zinc-800/80'
                        }`}
                      >
                        <span style={{ fontFamily: fam }} className="text-[13px] truncate">
                          {fam}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. System Fonts Section */}
            {filteredSystem.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-1 flex items-center justify-between">
                  <span>System Fonts ({filteredSystem.length})</span>
                </div>
                <div className="space-y-0.5">
                  {filteredSystem.map((sysFont) => {
                    const isSelected = sysFont.toLowerCase() === cleanCurrentFamily.toLowerCase();
                    return (
                      <button
                        key={`sys_${sysFont}`}
                        type="button"
                        onClick={() => handleSelect(sysFont)}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-300 hover:bg-zinc-800/80'
                        }`}
                      >
                        <span style={{ fontFamily: sysFont }} className="text-[13px] truncate">
                          {sysFont}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {filteredBundled.length === 0 && filteredSystem.length === 0 && filteredImported.length === 0 && (
              <div className="py-6 text-center text-zinc-500 text-xs">
                No fonts matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
