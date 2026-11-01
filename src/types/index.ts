export type Language = 'es' | 'en';
export type Theme = 'dark' | 'light';

export type ExampleCategory = 'basics' | 'concurrency' | 'advanced';
export type ExampleDifficulty = 'basic' | 'intermediate' | 'advanced';

export interface Example {
  id: string;
  category: ExampleCategory;
  difficulty: ExampleDifficulty;
  title: { es: string; en: string };
  description: { es: string; en: string };
  whatToObserve: { es: string[]; en: string[] };
  code: string;
  expectedOutput: string;
  taskEvents?: TaskEvent[];
}

export type TaskLifecycleState = 'created' | 'ready' | 'running' | 'blocked' | 'suspended' | 'terminated';

export interface TaskEvent {
  timestamp: number;
  taskId: string;
  taskName: string;
  event: TaskLifecycleState;
  detail?: string;
}

export interface LintDiagnostic {
  line: number;
  col: number;
  message: string;
  code: string;
}

export interface CompileResult {
  success: boolean;
  errors: LintDiagnostic[];
  warnings: LintDiagnostic[];
}

export type ConsoleStreamType =
  | 'stdout'
  | 'stderr'
  | 'warning'
  | 'system'
  | 'banner-success'
  | 'banner-error'
  | 'info';

export interface ConsoleEntry {
  id: string;
  timestamp: string;
  stream: ConsoleStreamType;
  text: string;
  content?: string;
}

export interface RunOptions {
  onOutput: (entry: Omit<ConsoleEntry, 'id' | 'timestamp'>) => void;
  onTaskEvent?: (event: TaskEvent) => void;
  signal?: AbortSignal;
  activeExample?: Example;
}

export interface CompilerService {
  compile(code: string): Promise<CompileResult>;
  run(code: string, options: RunOptions): Promise<{ exitCode: number; stoppedByUser?: boolean }>;
}

export interface EditorCursorPosition {
  line: number;
  col: number;
  totalLines: number;
  charCount: number;
}
