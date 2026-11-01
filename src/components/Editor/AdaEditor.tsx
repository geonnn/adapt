import React, { useRef, useEffect } from 'react';
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type * as monacoType from 'monaco-editor';
import { registerAdaLanguage, ADA_LANGUAGE_ID } from '../../runtime/adaLanguage';
import { lintAda, updateModelMarkers } from '../../runtime/linter';
import type { EditorCursorPosition, Theme } from '../../types';

export interface AdaEditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  onCursorChange?: (cursor: EditorCursorPosition) => void;
  theme: Theme;
}

const STORAGE_KEY = 'adaPT_code';

export const AdaEditor: React.FC<AdaEditorProps> = ({
  code,
  onChange,
  onRun,
  onCursorChange,
  theme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monacoType | null>(null);

  // Keep latest callback references for Monaco event handlers
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  const onCursorChangeRef = useRef(onCursorChange);
  onCursorChangeRef.current = onCursorChange;

  // Register Ada language before editor mount
  const handleBeforeMount: BeforeMount = (monacoInstance) => {
    registerAdaLanguage(monacoInstance as unknown as typeof monacoType);
  };

  // Setup Monaco instance, shortcuts, cursor tracking, and layout observer
  const handleOnMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance as unknown as typeof monacoType;

    // Register Ctrl+Enter / Cmd+Enter keyboard shortcut for Run
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
      onRunRef.current?.();
    });

    // Helper to query cursor position and document stats
    const reportCursorAndStats = () => {
      const model = editor.getModel();
      const pos = editor.getPosition();
      if (model && pos) {
        onCursorChangeRef.current?.({
          line: pos.lineNumber,
          col: pos.column,
          totalLines: model.getLineCount(),
          charCount: model.getValueLength(),
        });
      }
    };

    // Track cursor changes and text edits
    editor.onDidChangeCursorPosition(reportCursorAndStats);
    editor.onDidChangeModelContent(() => {
      reportCursorAndStats();
    });

    // Initial cursor report
    reportCursorAndStats();

    // Initial linter check on model mount
    const model = editor.getModel();
    if (model) {
      const diagnostics = lintAda(model.getValue());
      updateModelMarkers(monacoInstance as unknown as typeof monacoType, model, diagnostics);
    }
  };

  // Debounced (500ms) code persistence to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch (err) {
        console.warn('Unable to persist editor code to localStorage', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [code]);

  // Debounced (800ms) linter invocation updating model markers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          const diagnostics = lintAda(code);
          updateModelMarkers(monacoRef.current, model, diagnostics);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [code]);

  // Two-tier Monaco resize handler via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });

    resizeObserver.observe(container);

    const handleWindowResize = () => {
      editorRef.current?.layout();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-panel">
      <Editor
        height="100%"
        width="100%"
        language={ADA_LANGUAGE_ID}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        value={code}
        onChange={(val) => onChange(val ?? '')}
        beforeMount={handleBeforeMount}
        onMount={handleOnMount}
        options={{
          automaticLayout: true,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 13.5,
          lineHeight: 20,
          tabSize: 3,
          insertSpaces: true,
          detectIndentation: false,
          minimap: { enabled: true, maxColumn: 80, scale: 0.8 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          padding: { top: 8, bottom: 8 },
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
};

export default AdaEditor;
