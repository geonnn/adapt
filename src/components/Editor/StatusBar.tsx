import React from 'react';
import { FileCode, Cpu } from 'lucide-react';
import type { EditorCursorPosition } from '../../types';
import type { TranslationSchema } from '../../i18n/translations';

export interface StatusBarProps {
  cursorPosition: EditorCursorPosition;
  activeExampleTitle?: string;
  translations: TranslationSchema;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  cursorPosition,
  activeExampleTitle,
  translations: t,
}) => {
  return (
    <footer className="h-7 border-t border-border-theme bg-panel-subtle px-3 flex items-center justify-between text-xs text-txt-muted select-none flex-shrink-0 z-10 font-mono">
      {/* Left indicators: File/Example & Cursor stats */}
      <div className="flex items-center gap-3">
        {/* Active Example / File */}
        <div className="flex items-center gap-1.5 text-txt-secondary font-sans font-medium">
          <FileCode className="w-3.5 h-3.5 text-sky-500" />
          <span className="truncate max-w-[150px] sm:max-w-[200px]">
            {activeExampleTitle || t.statusBar.untitled}
          </span>
        </div>

        <div className="h-3 w-px bg-border-theme hidden sm:block" />

        {/* Cursor Position */}
        <div className="hidden sm:inline-block">
          {t.statusBar.line} {cursorPosition.line}, {t.statusBar.col} {cursorPosition.col}
        </div>

        <div className="h-3 w-px bg-border-theme hidden md:block" />

        {/* Line & Character Counts */}
        <div className="hidden md:inline-block">
          {cursorPosition.totalLines} {t.statusBar.lines} | {cursorPosition.charCount}{' '}
          {t.statusBar.chars}
        </div>
      </div>

      {/* Right indicators: Mode, Simulation badge, Encoding */}
      <div className="flex items-center gap-3">
        {/* Language Standard */}
        <span className="hidden lg:inline-block text-[11px] text-txt-muted font-sans">
          Ada 2012 / 2022
        </span>

        {/* Simulation Badge */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-semibold font-sans">
          <Cpu className="w-3 h-3" />
          <span>{t.statusBar.simulationMode}</span>
        </div>

        <div className="h-3 w-px bg-border-theme hidden sm:block" />

        {/* Encoding & Indentation */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-txt-muted font-sans">
          <span>{t.statusBar.encoding}</span>
          <span>·</span>
          <span>{t.statusBar.indent}</span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
