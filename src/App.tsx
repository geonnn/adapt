import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import { getExampleById, getDefaultExample } from './examples';
import type {
  Example,
  ConsoleEntry,
  ConsoleStreamType,
  TaskEvent,
  EditorCursorPosition,
} from './types';
import { compilerService } from './runtime/compiler';
import { Navbar } from './components/Navbar/Navbar';
import { InfoPanel } from './components/InfoPanel/InfoPanel';
import { ChevronLeft, Terminal, FileCode } from 'lucide-react';
import { AdaEditor } from './components/Editor/AdaEditor';
import { StatusBar } from './components/Editor/StatusBar';
import { Console, type ConsoleTab } from './components/Console/Console';
import { ResizableSplit } from './components/ResizableSplit/ResizableSplit';
import { ConfirmDialog } from './components/Modal/ConfirmDialog';

const CODE_STORAGE_KEY = 'adaPT_code';
const EXAMPLE_STORAGE_KEY = 'adaPT_activeExampleId';
const RIGHT_PANEL_STORAGE_KEY = 'adaPT_rightPanelCollapsed';

let entrySequence = 0;

function formatTimestamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `[${hh}:${mm}:${ss}]`;
}

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, translations: t } = useLanguage();

  // Active example state
  const [activeExample, setActiveExample] = useState<Example | null>(() => {
    try {
      const storedId = localStorage.getItem(EXAMPLE_STORAGE_KEY);
      if (storedId && storedId !== 'custom') {
        const found = getExampleById(storedId);
        if (found) return found;
      }
    } catch (e) {
      console.warn('Unable to read initial example ID', e);
    }
    return getDefaultExample();
  });

  // Editor code state
  const [editorCode, setEditorCode] = useState<string>(() => {
    try {
      const storedCode = localStorage.getItem(CODE_STORAGE_KEY);
      if (storedCode !== null && storedCode.trim().length > 0) {
        return storedCode;
      }
    } catch (e) {
      console.warn('Unable to read initial editor code', e);
    }
    return getDefaultExample().code;
  });

  // Baseline code for unsaved changes detection
  const [originalCode, setOriginalCode] = useState<string>(() => {
    return activeExample ? activeExample.code : editorCode;
  });

  // Cursor position and document metrics
  const [cursorPosition, setCursorPosition] = useState<EditorCursorPosition>({
    line: 1,
    col: 1,
    totalLines: 1,
    charCount: editorCode.length,
  });

  // Execution & Console states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [taskEvents, setTaskEvents] = useState<TaskEvent[]>([]);
  const [activeTab, setActiveTab] = useState<ConsoleTab>('output');

  // Right panel collapsed state
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(RIGHT_PANEL_STORAGE_KEY);
      return stored === 'true';
    } catch (e) {
      console.warn('Unable to read right panel state from localStorage', e);
      return false;
    }
  });

  const toggleRightCollapse = useCallback(() => {
    setIsRightCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(RIGHT_PANEL_STORAGE_KEY, String(next));
      } catch (e) {
        console.warn('Unable to persist right panel state to localStorage', e);
      }
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return next;
    });
  }, []);

  // Modal dialog state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    pendingAction: (() => void) | null;
  }>({
    isOpen: false,
    pendingAction: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Append entry to console output
  const addConsoleEntry = useCallback(
    (stream: ConsoleStreamType, text: string) => {
      entrySequence++;
      const newEntry: ConsoleEntry = {
        id: `${Date.now()}-${entrySequence}`,
        timestamp: formatTimestamp(),
        stream,
        text,
      };
      setConsoleEntries((prev) => [...prev, newEntry]);
    },
    []
  );

  // Clear console entries
  const handleClearConsole = useCallback(() => {
    setConsoleEntries([]);
  }, []);

  // Persist active example id
  useEffect(() => {
    try {
      if (activeExample) {
        localStorage.setItem(EXAMPLE_STORAGE_KEY, activeExample.id);
      } else {
        localStorage.setItem(EXAMPLE_STORAGE_KEY, 'custom');
      }
    } catch (e) {
      console.warn('Unable to persist active example ID', e);
    }
  }, [activeExample]);

  // Check if editor has unsaved changes compared to baseline
  const isDirty = editorCode !== originalCode;

  // Safe example loader with dirty-check modal
  const loadExample = useCallback(
    (exampleId: string) => {
      const target = getExampleById(exampleId);
      if (!target) return;

      const performLoad = () => {
        setActiveExample(target);
        setEditorCode(target.code);
        setOriginalCode(target.code);
        setConsoleEntries([]);
        setTaskEvents([]);
        try {
          localStorage.setItem(CODE_STORAGE_KEY, target.code);
        } catch {
          // ignore
        }
      };

      if (isDirty) {
        setModalState({
          isOpen: true,
          pendingAction: performLoad,
        });
      } else {
        performLoad();
      }
    },
    [isDirty]
  );

  // Safe reset to default example with dirty-check modal
  const handleReset = useCallback(() => {
    const defaultEx = getDefaultExample();
    const performReset = () => {
      setActiveExample(defaultEx);
      setEditorCode(defaultEx.code);
      setOriginalCode(defaultEx.code);
      setConsoleEntries([]);
      setTaskEvents([]);
      try {
        localStorage.setItem(CODE_STORAGE_KEY, defaultEx.code);
      } catch {
        // ignore
      }
    };

    if (isDirty) {
      setModalState({
        isOpen: true,
        pendingAction: performReset,
      });
    } else {
      performReset();
    }
  }, [isDirty]);

  // Safe import code from disk with dirty-check modal
  const handleImportCode = useCallback(
    (importedCode: string, _fileName?: string) => {
      const performImport = () => {
        setActiveExample(null); // marked as custom code
        setEditorCode(importedCode);
        setOriginalCode(importedCode);
        setConsoleEntries([]);
        setTaskEvents([]);
        try {
          localStorage.setItem(CODE_STORAGE_KEY, importedCode);
        } catch {
          // ignore
        }
      };

      if (isDirty) {
        setModalState({
          isOpen: true,
          pendingAction: performImport,
        });
      } else {
        performImport();
      }
    },
    [isDirty]
  );

  // Stop running execution
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Run compilation and streaming execution
  const handleRun = useCallback(async () => {
    // If already running, treat click as stop
    if (isRunningRef.current) {
      handleStop();
      return;
    }

    // Switch to Output console tab
    setActiveTab('output');
    if (isRightCollapsed) {
      setIsRightCollapsed(false);
      try {
        localStorage.setItem(RIGHT_PANEL_STORAGE_KEY, 'false');
      } catch {
        // ignore
      }
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
    setIsRunning(true);
    setTaskEvents([]);

    // Initial compiling notice
    addConsoleEntry('system', t.console.banners.compiling);

    // 1. Compile with client-side Ada linter
    try {
      const compileResult = await compilerService.compile(editorCode);

      if (!compileResult.success) {
        addConsoleEntry(
          'banner-error',
          `${t.console.banners.compiledError} (${compileResult.errors.length} error${
            compileResult.errors.length > 1 ? (language === 'es' ? 'es' : 's') : ''
          })`
        );

        for (const err of compileResult.errors) {
          addConsoleEntry(
            'stderr',
            `[ERROR] line ${err.line}:${err.col} — ${err.message}`
          );
        }

        setIsRunning(false);
        return;
      }

      addConsoleEntry('banner-success', t.console.banners.compiledSuccess);

      // 2. Run simulation engine
      const controller = new AbortController();
      abortControllerRef.current = controller;

      await compilerService.run(editorCode, {
        signal: controller.signal,
        activeExample: activeExample ?? undefined,
        onOutput: (entry) => {
          addConsoleEntry(entry.stream, entry.text);
        },
        onTaskEvent: (ev) => {
          setTaskEvents((prev) => [...prev, ev]);
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addConsoleEntry('stderr', `Unexpected execution failure: ${msg}`);
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, [editorCode, activeExample, language, t, addConsoleEntry, handleStop]);

  // Global keyboard shortcuts: Ctrl+Enter (Run) & Ctrl+L (Clear)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter -> Run / Stop
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isRunningRef.current) {
          handleStop();
        } else {
          handleRun();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleRun, handleStop]);

  return (
    <div className="flex flex-col h-screen w-screen bg-app text-txt-primary overflow-hidden">
      {/* Top Navigation Bar */}
      <Navbar
        activeExampleId={activeExample?.id ?? null}
        onSelectExample={loadExample}
        onReset={handleReset}
        isRunning={isRunning}
        onRun={handleRun}
        onStop={handleStop}
        editorCode={editorCode}
        onImportCode={handleImportCode}
        language={language}
        onToggleLanguage={toggleLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        translations={t}
      />

      {/* Main Resizable Workspace */}
      <main className="flex-1 overflow-hidden relative">
        <ResizableSplit
          isRightCollapsed={isRightCollapsed}
          rightCollapsedContent={
            <aside
              className="w-11 flex-shrink-0 h-full border-l border-border-theme bg-panel-subtle flex flex-col items-center py-3 select-none transition-all duration-200 ease-in-out z-10"
              aria-label={t.console.expand}
            >
              <button
                onClick={toggleRightCollapse}
                className="p-1.5 rounded-lg border border-border-theme bg-panel hover:bg-panel-subtle text-txt-primary hover:text-sky-500 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
                title={t.console.expand}
                aria-label={t.console.expand}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center justify-center py-4">
                <span
                  className="text-xs font-semibold tracking-wider text-txt-muted uppercase whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  {t.console.title}
                </span>
              </div>

              <div className="p-1 text-txt-muted relative">
                <Terminal className="w-4 h-4 opacity-50" />
                {consoleEntries.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-panel" />
                )}
              </div>
            </aside>
          }
          left={
            <>
              {/* Collapsible Info Panel */}
              <InfoPanel
                example={activeExample}
                language={language}
                translations={t}
              />

              {/* Editor Column: Editor Header + Monaco Editor + Status Bar */}
              <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-panel">
                {/* Editor Tab Bar - Aligns perfectly with InfoPanel and Console h-9 headers */}
                <div className="h-9 border-b border-border-theme bg-panel-subtle flex items-center justify-between text-xs flex-shrink-0 select-none relative z-10">
                  <div className="flex items-center h-full">
                    <div className="flex items-center gap-1.5 px-3 h-full bg-panel border-r border-border-theme font-medium text-txt-primary border-t-2 border-t-sky-500">
                      <FileCode className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                      <span className="font-mono text-xs">
                        {activeExample ? `${activeExample.id}.adb` : 'main.adb'}
                      </span>
                      {isDirty && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ml-1" title="Cambios sin guardar" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pr-3 text-txt-muted text-[11px] font-sans">
                    <span className="hidden sm:inline">Ada source</span>
                  </div>
                </div>

                <div className="flex-1 relative overflow-hidden">
                  <AdaEditor
                    code={editorCode}
                    onChange={setEditorCode}
                    onRun={handleRun}
                    onCursorChange={setCursorPosition}
                    theme={theme}
                  />
                </div>
                <StatusBar
                  cursorPosition={cursorPosition}
                  activeExampleTitle={activeExample ? activeExample.title[language] : undefined}
                  translations={t}
                />
              </div>
            </>
          }
          right={
            <Console
              entries={consoleEntries}
              taskEvents={taskEvents}
              onClear={handleClearConsole}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onToggleCollapse={toggleRightCollapse}
              translations={t}
            />
          }
        />
      </main>

      {/* Unsaved Changes Confirmation Modal */}
      <ConfirmDialog
        isOpen={modalState.isOpen}
        title={t.modal.unsavedTitle}
        message={t.modal.unsavedMessage}
        confirmLabel={t.modal.discardAndLoad}
        cancelLabel={t.modal.cancel}
        onConfirm={() => {
          modalState.pendingAction?.();
          setModalState({ isOpen: false, pendingAction: null });
        }}
        onCancel={() => {
          setModalState({ isOpen: false, pendingAction: null });
        }}
      />
    </div>
  );
};

export default App;
