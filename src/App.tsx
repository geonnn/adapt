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
import { AdaEditor } from './components/Editor/AdaEditor';
import { StatusBar } from './components/Editor/StatusBar';
import { Console, type ConsoleTab } from './components/Console/Console';
import { ResizableSplit } from './components/ResizableSplit/ResizableSplit';
import { ConfirmDialog } from './components/Modal/ConfirmDialog';

const CODE_STORAGE_KEY = 'adaPT_code';
const EXAMPLE_STORAGE_KEY = 'adaPT_activeExampleId';

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
          left={
            <>
              {/* Collapsible Info Panel */}
              <InfoPanel
                example={activeExample}
                language={language}
                translations={t}
              />

              {/* Editor Column: Monaco Editor + Status Bar */}
              <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
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
