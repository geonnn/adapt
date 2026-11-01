import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Activity,
  Bug,
  Trash2,
  ArrowDownCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { ConsoleEntry, TaskEvent } from '../../types';
import type { TranslationSchema } from '../../i18n/translations';
import { TaskPanel } from '../TaskPanel/TaskPanel';
import { DebugPanel } from '../DebugPanel/DebugPanel';

export type ConsoleTab = 'output' | 'tasks' | 'debugger';

export interface ConsoleProps {
  entries: ConsoleEntry[];
  taskEvents: TaskEvent[];
  onClear: () => void;
  activeTab?: ConsoleTab;
  onTabChange?: (tab: ConsoleTab) => void;
  onToggleCollapse?: () => void;
  translations: TranslationSchema;
}

export const Console: React.FC<ConsoleProps> = ({
  entries,
  taskEvents,
  onClear,
  activeTab: controlledActiveTab,
  onTabChange,
  onToggleCollapse,
  translations: t,
}) => {
  const [internalTab, setInternalTab] = useState<ConsoleTab>('output');
  const activeTab = controlledActiveTab ?? internalTab;

  const setActiveTab = (tab: ConsoleTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new entries if enabled
  useEffect(() => {
    if (activeTab === 'output' && autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [entries, autoScroll, activeTab]);

  // Track user scroll position to pause/resume auto-scroll
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (isAtBottom !== autoScroll) {
      setAutoScroll(isAtBottom);
    }
  };

  // Keyboard shortcut Ctrl+L to clear console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        onClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClear]);

  // Style line according to stream type
  const renderStreamLine = (entry: ConsoleEntry) => {
    const text = entry.text || entry.content || '';

    switch (entry.stream) {
      case 'banner-success':
        return (
          <div className="my-1.5 px-3 py-1.5 rounded-r bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-400 font-semibold font-mono text-xs">
            {text}
          </div>
        );
      case 'banner-error':
        return (
          <div className="my-1.5 px-3 py-1.5 rounded-r bg-rose-950/40 border-l-4 border-rose-500 text-rose-400 font-semibold font-mono text-xs">
            {text}
          </div>
        );
      case 'stderr':
        return <span className="text-rose-400 font-mono">{text}</span>;
      case 'warning':
        return <span className="text-amber-400 font-mono">{text}</span>;
      case 'system':
        return <span className="text-sky-400 font-mono">{text}</span>;
      case 'info':
        return <span className="text-cyan-400 font-mono">{text}</span>;
      case 'stdout':
      default:
        return <span className="text-txt-primary font-mono">{text}</span>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-console-bg border-l border-border-theme overflow-hidden select-none">
      {/* Tab Header & Action Bar */}
      <div className="h-9 border-b border-border-theme bg-panel-subtle px-2 flex items-center justify-between text-xs flex-shrink-0 gap-1 overflow-hidden select-none relative">
        {/* Left Tabs (Shrinkable & scrollable on narrow widths) */}
        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-t-md font-medium transition-colors border-b-2 flex-shrink-0 ${
              activeTab === 'output'
                ? 'border-sky-500 text-txt-primary bg-panel font-semibold'
                : 'border-transparent text-txt-muted hover:text-txt-primary'
            }`}
            title={t.console.tabs.output}
          >
            <Terminal className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
            <span className="truncate">{t.console.tabs.output}</span>
            {entries.length > 0 && (
              <span className="ml-1 text-[10px] font-mono px-1 rounded-full bg-border-theme text-txt-muted flex-shrink-0">
                {entries.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-t-md font-medium transition-colors border-b-2 flex-shrink-0 ${
              activeTab === 'tasks'
                ? 'border-sky-500 text-txt-primary bg-panel font-semibold'
                : 'border-transparent text-txt-muted hover:text-txt-primary'
            }`}
            title={t.console.tabs.tasks}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{t.console.tabs.tasks}</span>
            {taskEvents.length > 0 && (
              <span className="ml-1 text-[10px] font-mono px-1 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                {taskEvents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('debugger')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-t-md font-medium transition-colors border-b-2 flex-shrink-0 ${
              activeTab === 'debugger'
                ? 'border-sky-500 text-txt-primary bg-panel font-semibold'
                : 'border-transparent text-txt-muted hover:text-txt-primary'
            }`}
            title={t.console.tabs.debugger}
          >
            <Bug className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <span className="truncate">{t.console.tabs.debugger}</span>
          </button>
        </div>

        {/* Right Actions (Pinned with flex-shrink-0 - always visible on right edge) */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto z-10 bg-panel-subtle pl-1.5 py-1">
          {activeTab === 'output' && (
            <>
              <button
                onClick={() => {
                  const next = !autoScroll;
                  setAutoScroll(next);
                  if (next && scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                  }
                }}
                className={`p-1 rounded hover:bg-panel transition-colors flex-shrink-0 ${
                  autoScroll ? 'text-sky-500' : 'text-txt-muted hover:text-txt-primary'
                }`}
                title={`${t.console.autoScroll}: ${autoScroll ? 'ON' : 'OFF'}`}
                aria-label={t.console.autoScroll}
              >
                <ArrowDownCircle className="w-4 h-4" />
              </button>

              <button
                onClick={onClear}
                className="p-1 rounded text-txt-muted hover:text-rose-500 hover:bg-panel transition-colors flex-shrink-0"
                title={t.console.clearShortcut}
                aria-label={t.console.clear}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {onToggleCollapse && (
            <>
              <div className="h-3.5 w-px bg-border-theme mx-0.5 flex-shrink-0" />
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded text-txt-muted hover:text-txt-primary hover:bg-panel transition-colors flex-shrink-0"
                title={t.console.collapse}
                aria-label={t.console.collapse}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'output' && (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed select-text space-y-1"
          >
            {entries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-txt-muted space-y-2 select-none">
                <Sparkles className="w-8 h-8 opacity-40 text-txt-muted" />
                <p className="max-w-xs text-xs leading-relaxed">
                  {t.console.emptyState}
                </p>
              </div>
            ) : (
              entries.map((entry) => {
                const isBanner =
                  entry.stream === 'banner-success' || entry.stream === 'banner-error';

                if (isBanner) {
                  return (
                    <div key={entry.id}>
                      {renderStreamLine(entry)}
                    </div>
                  );
                }

                return (
                  <div key={entry.id} className="flex items-start">
                    <span className="text-zinc-500 select-none mr-2 flex-shrink-0 font-mono text-[11px]">
                      {entry.timestamp}
                    </span>
                    <div className="flex-1 break-words">
                      {renderStreamLine(entry)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskPanel taskEvents={taskEvents} translations={t} />
        )}

        {activeTab === 'debugger' && (
          <DebugPanel translations={t} />
        )}
      </div>
    </div>
  );
};

export default Console;
