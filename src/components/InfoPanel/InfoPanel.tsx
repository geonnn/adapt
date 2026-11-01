import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
  Code2,
  Sparkles,
} from 'lucide-react';
import type { Example, Language, ExampleDifficulty } from '../../types';
import type { TranslationSchema } from '../../i18n/translations';

export interface InfoPanelProps {
  example: Example | null;
  language: Language;
  translations: TranslationSchema;
}

const STORAGE_KEY = 'adaPT_infoPanelCollapsed';

export const InfoPanel: React.FC<InfoPanelProps> = ({
  example,
  language,
  translations: t,
}) => {
  // Read initial collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch (e) {
      console.warn('Unable to read info panel state from localStorage', e);
      return false;
    }
  });

  // Persist collapsed state to localStorage and trigger layout event
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch (e) {
        console.warn('Unable to persist info panel state to localStorage', e);
      }
      // Notify parent layout and Monaco editor
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return next;
    });
  };

  const getDifficultyBadge = (difficulty: ExampleDifficulty) => {
    switch (difficulty) {
      case 'basic':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {t.difficulties.basic}
          </span>
        );
      case 'intermediate':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {t.difficulties.intermediate}
          </span>
        );
      case 'advanced':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
            {t.difficulties.advanced}
          </span>
        );
    }
  };

  // Render Collapsed Sidebar Strip
  if (isCollapsed) {
    return (
      <aside
        className="w-11 flex-shrink-0 h-full border-r border-border-theme bg-panel-subtle flex flex-col items-center py-3 select-none transition-all duration-200 ease-in-out z-10"
        aria-label={t.infoPanel.expand}
      >
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg border border-border-theme bg-panel hover:bg-panel-subtle text-txt-primary hover:text-sky-500 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
          title={t.infoPanel.expand}
          aria-label={t.infoPanel.expand}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center justify-center py-4">
          <span
            className="text-xs font-semibold tracking-wider text-txt-muted uppercase whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {t.infoPanel.title}
          </span>
        </div>

        <div className="p-1.5 text-txt-muted">
          <BookOpen className="w-4 h-4 opacity-50" />
        </div>
      </aside>
    );
  }

  // Render Expanded Info Panel
  return (
    <aside className="w-72 sm:w-80 flex-shrink-0 h-full border-r border-border-theme bg-panel-subtle flex flex-col select-none overflow-hidden transition-all duration-200 ease-in-out z-10">
      {/* Header */}
      <div className="h-10 px-3.5 border-b border-border-theme flex items-center justify-between bg-panel/50 flex-shrink-0">
        <div className="flex items-center gap-2 text-txt-primary">
          <BookOpen className="w-4 h-4 text-sky-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-txt-primary">
            {t.infoPanel.title}
          </h2>
        </div>
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-md border border-border-theme bg-panel hover:bg-panel-subtle text-txt-muted hover:text-txt-primary transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
          title={t.infoPanel.collapse}
          aria-label={t.infoPanel.collapse}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {example ? (
          <>
            {/* Title & Metadata */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-txt-muted">
                  {t.categories[example.category]}
                </span>
                {getDifficultyBadge(example.difficulty)}
              </div>
              <h1 className="text-base font-bold text-txt-primary leading-tight">
                {example.title[language]}
              </h1>
            </div>

            <div className="h-px bg-border-theme/60" />

            {/* Ada Concept Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-txt-primary">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>{t.infoPanel.concept}</span>
              </div>
              <p className="text-xs text-txt-secondary leading-relaxed bg-panel p-3 rounded-lg border border-border-theme select-text">
                {example.description[language]}
              </p>
            </div>

            {/* What to observe Section */}
            {example.whatToObserve[language]?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-txt-primary">
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.infoPanel.whatToObserve}</span>
                </div>
                <ul className="space-y-2 text-xs text-txt-secondary select-text">
                  {example.whatToObserve[language].map((bullet, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 bg-panel/70 p-2.5 rounded-lg border border-border-theme/70"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                      <span className="leading-normal">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          /* Custom Code Fallback Notice */
          <div className="space-y-3 p-4 rounded-xl border border-dashed border-border-theme bg-panel text-center">
            <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-txt-primary">
              {t.infoPanel.customCodeTitle}
            </h3>
            <p className="text-xs text-txt-secondary leading-relaxed">
              {t.infoPanel.customCodeDesc}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default InfoPanel;
