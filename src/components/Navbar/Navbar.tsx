import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Play,
  Square,
  Copy,
  Check,
  Upload,
  Download,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';
import { examples } from '../../examples';
import type { Language, Theme, ExampleCategory, ExampleDifficulty } from '../../types';
import type { TranslationSchema } from '../../i18n/translations';

export interface NavbarProps {
  activeExampleId: string | null;
  onSelectExample: (exampleId: string) => void;
  onReset: () => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  editorCode: string;
  onImportCode: (code: string, fileName?: string) => void;
  language: Language;
  onToggleLanguage: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  translations: TranslationSchema;
}

const CATEGORY_ORDER: ExampleCategory[] = ['basics', 'concurrency', 'advanced'];

export const Navbar: React.FC<NavbarProps> = ({
  activeExampleId,
  onSelectExample,
  onReset,
  isRunning,
  onRun,
  onStop,
  editorCode,
  onImportCode,
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
  translations: t,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Copy code with 2-second visual feedback
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(editorCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = editorCode;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
  };

  // Export code as .adb file download
  const handleExport = () => {
    try {
      const blob = new Blob([editorCode], { type: 'text/plain;charset=utf-8' });
      const filename = `${activeExampleId || 'programa'}.adb`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Failed to export code', err);
    }
  };

  // Handle hidden file input trigger
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        onImportCode(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Get active example title
  const activeExample = examples.find((ex) => ex.id === activeExampleId);
  const activeTitle = activeExample
    ? activeExample.title[language]
    : t.statusBar.untitled;

  const getDifficultyPill = (difficulty: ExampleDifficulty) => {
    switch (difficulty) {
      case 'basic':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {t.difficulties.basic}
          </span>
        );
      case 'intermediate':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {t.difficulties.intermediate}
          </span>
        );
      case 'advanced':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">
            {t.difficulties.advanced}
          </span>
        );
    }
  };

  return (
    <header className="h-12 border-b border-border-theme bg-navbar px-3 flex items-center justify-between select-none z-20 flex-shrink-0">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".adb,.ads,.txt"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Left section: Logo & Examples Dropdown */}
      <div className="flex items-center gap-3">
        {/* Brand Logo & Reset Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-2 group px-2 py-1 rounded-md hover:bg-panel-subtle transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
          title={t.navbar.resetTooltip}
        >
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-base tracking-tight text-txt-primary">
              {t.navbar.title}
            </span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-panel-subtle border border-border-theme text-txt-muted">
              v0.1
            </span>
          </div>
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-border-theme" />

        {/* Categorized Examples Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border-theme bg-panel hover:bg-panel-subtle text-txt-primary transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="text-txt-muted">{t.navbar.examples}:</span>
            <span className="font-semibold max-w-[140px] sm:max-w-[180px] truncate">
              {activeTitle}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-txt-muted transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-80 max-h-96 overflow-y-auto bg-panel border border-border-theme rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {CATEGORY_ORDER.map((category) => {
                const categoryExamples = examples.filter((ex) => ex.category === category);
                if (categoryExamples.length === 0) return null;

                return (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-2.5 py-1 text-[11px] font-semibold text-txt-muted uppercase tracking-wider">
                      {t.categories[category]}
                    </div>
                    <div className="space-y-0.5">
                      {categoryExamples.map((ex) => {
                        const isSelected = ex.id === activeExampleId;
                        return (
                          <button
                            key={ex.id}
                            onClick={() => {
                              onSelectExample(ex.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors ${
                              isSelected
                                ? 'bg-sky-500/10 text-sky-500 font-medium'
                                : 'text-txt-primary hover:bg-panel-subtle'
                            }`}
                          >
                            <span className="truncate pr-2">{ex.title[language]}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {getDifficultyPill(ex.difficulty)}
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center/Right section: Execution Controls & Utilities */}
      <div className="flex items-center gap-2">
        {/* Run / Stop Button */}
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm animate-pulse transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
            title={t.navbar.stop}
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{t.navbar.stop}</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title={`${t.navbar.run} (Ctrl+Enter)`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t.navbar.run}</span>
            <span className="hidden md:inline-block ml-0.5 text-[10px] text-emerald-200/80 font-mono">
              Ctrl+↵
            </span>
          </button>
        )}

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border-theme bg-panel hover:bg-panel-subtle text-txt-primary transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
          title={copied ? t.navbar.copied : t.navbar.copy}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">{t.navbar.copied}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-txt-muted" />
              <span className="hidden sm:inline">{t.navbar.copy}</span>
            </>
          )}
        </button>

        {/* Import .adb */}
        <button
          onClick={handleImportClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border-theme bg-panel hover:bg-panel-subtle text-txt-primary transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
          title={t.navbar.import}
        >
          <Upload className="w-3.5 h-3.5 text-txt-muted" />
          <span className="hidden sm:inline">{t.navbar.import}</span>
        </button>

        {/* Export .adb */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border-theme bg-panel hover:bg-panel-subtle text-txt-primary transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
          title={t.navbar.export}
        >
          <Download className="w-3.5 h-3.5 text-txt-muted" />
          <span className="hidden sm:inline">{t.navbar.export}</span>
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-border-theme" />

        {/* Language Segmented Toggle */}
        <div className="inline-flex items-center rounded-lg border border-border-theme bg-panel p-0.5 text-xs font-semibold">
          <button
            onClick={() => language !== 'es' && onToggleLanguage()}
            className={`px-2 py-1 rounded-md transition-colors ${
              language === 'es'
                ? 'bg-sky-500 text-white'
                : 'text-txt-muted hover:text-txt-primary'
            }`}
            title="Español"
          >
            ES
          </button>
          <button
            onClick={() => language !== 'en' && onToggleLanguage()}
            className={`px-2 py-1 rounded-md transition-colors ${
              language === 'en'
                ? 'bg-sky-500 text-white'
                : 'text-txt-muted hover:text-txt-primary'
            }`}
            title="English"
          >
            EN
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg border border-border-theme bg-panel hover:bg-panel-subtle text-txt-primary transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
          title={t.navbar.theme}
          aria-label={t.navbar.theme}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
