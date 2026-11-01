/**
 * AdaPT Simulation Runtime & Decoupled Compiler Service (Plan B)
 *
 * Implements CompilerService:
 * 1. compile(code): delegates to client-side TypeScript Ada linter (`lintAda`).
 * 2. run(code, options):
 *    - Streaming execution engine with 100–300ms paced delays.
 *    - Stop button cancellation via AbortSignal (exit code 130).
 *    - Hard 10-second execution timeout (exit code 1).
 *    - Smart normalized example matching against active and library examples.
 *    - TaskEvent telemetry emission for concurrent examples (Phase 2 groundwork).
 *    - Sequential Put_Line statement interpreter with string concatenation and 'Image evaluation.
 *    - Graceful fallback notice for unmodeled arbitrary custom code.
 */

import type {
  CompileResult,
  CompilerService,
  Example,
  RunOptions,
  TaskEvent,
} from '../types';
import { lintAda } from './linter';
import { examples } from '../examples';

export const DEFAULT_LINE_DELAY_MS = 150;
export const EXECUTION_TIMEOUT_MS = 10000;

/**
 * Asynchronous abortable sleep helper.
 * Rejects immediately with DOMException('Aborted', 'AbortError') if signal is aborted.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Normalizes Ada source code for smart example matching:
 * 1. Protects double-quoted string literals with placeholders.
 * 2. Strips Ada line comments (--.*$).
 * 3. Folds all non-string tokens to lowercase (Ada keywords and identifiers are case-insensitive).
 * 4. Normalizes whitespace around syntax delimiters (parentheses, semicolons, commas, assignment).
 * 5. Collapses all consecutive whitespace characters into a single space and trims.
 * 6. Restores original string literals (preserving string content and internal casing).
 */
export function normalizeAdaCode(code: string): string {
  // 1. Extract string literals into placeholders __ADA_STR_0__, __ADA_STR_1__, ...
  // Ada string literals are delimited by double quotes with "" representing an escaped quote.
  const stringLiterals: string[] = [];
  const codeWithoutStrings = code.replace(/"(?:""|[^"\r\n])*"/g, (match) => {
    const idx = stringLiterals.length;
    stringLiterals.push(match);
    return `__ADA_STR_${idx}__`;
  });

  // 2. Strip Ada line comments (-- to end of line)
  const codeWithoutComments = codeWithoutStrings.replace(/--.*$/gm, '');

  // 3. Lowercase everything outside string literals
  let normalized = codeWithoutComments.toLowerCase();

  // 4. Normalize spacing around punctuation delimiters
  normalized = normalized.replace(/\s*(:=)\s*/g, ' := ');
  normalized = normalized.replace(/\s*([();,])\s*/g, ' $1 ');

  // 5. Collapse all whitespace into a single space and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // 6. Restore original string literals
  normalized = normalized.replace(/__ada_str_(\d+)__/g, (_, idxStr) => {
    const idx = parseInt(idxStr, 10);
    return stringLiterals[idx] ?? '';
  });

  return normalized;
}

/**
 * Searches for a matching preprogrammed example using normalized code comparison.
 * Checks activeExample first, then library examples.
 */
export function findMatchingExample(code: string, options?: RunOptions): Example | null {
  const normalizedUser = normalizeAdaCode(code);

  // 1. Priority check: the currently active example if passed in options
  if (options?.activeExample) {
    if (normalizeAdaCode(options.activeExample.code) === normalizedUser) {
      return options.activeExample;
    }
  }

  // 2. Check all library examples
  for (const example of examples) {
    if (normalizeAdaCode(example.code) === normalizedUser) {
      return example;
    }
  }

  return null;
}

/**
 * Helper to split string expressions by concatenation operator '&'
 * outside string literals and parentheses.
 */
export function splitConcatenation(expr: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inString = false;
  let parenDepth = 0;

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '"') {
      if (inString && expr[i + 1] === '"') {
        current += '""';
        i++;
        continue;
      }
      inString = !inString;
      current += ch;
    } else if (inString) {
      current += ch;
    } else if (ch === '(') {
      parenDepth++;
      current += ch;
    } else if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += ch;
    } else if (ch === '&' && parenDepth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * Evaluates a scalar expression (numeric, boolean, or variable) for interpreter calculations.
 */
function evaluateScalar(
  expr: string,
  env: Map<string, number | string | boolean>
): number | boolean | null {
  expr = expr.trim();
  const lower = expr.toLowerCase();

  if (lower === 'true') return true;
  if (lower === 'false') return false;

  if (env.has(lower)) {
    const val = env.get(lower);
    if (typeof val === 'number' || typeof val === 'boolean') {
      return val;
    }
  }

  // Decimal number
  if (/^-?\d+(?:\.\d+)?$/.test(expr)) {
    return Number(expr);
  }

  // Simple binary arithmetic: Left Op Right
  const opMatch = expr.match(/^([a-zA-Z_]\w*|-?\d+(?:\.\d+)?)\s*([+\-*/])\s*([a-zA-Z_]\w*|-?\d+(?:\.\d+)?)$/);
  if (opMatch) {
    const left = evaluateScalar(opMatch[1], env);
    const op = opMatch[2];
    const right = evaluateScalar(opMatch[3], env);
    if (typeof left === 'number' && typeof right === 'number') {
      switch (op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? Math.floor(left / right) : null;
      }
    }
  }

  return null;
}

/**
 * Evaluates an individual term within an Ada Put_Line expression.
 */
function evaluateTerm(
  term: string,
  env: Map<string, number | string | boolean>
): string | null {
  term = term.trim();
  if (!term) return '';

  // 1. String literal
  if (term.startsWith('"') && term.endsWith('"') && term.length >= 2) {
    const inner = term.slice(1, -1);
    return inner.replace(/""/g, '"');
  }

  // 2. Attribute 'Image call: Type'Image(arg) or 'Image(arg)
  const imageCallMatch = term.match(/^(?:([a-zA-Z_]\w*)')?Image\s*\(([\s\S]*)\)$/i);
  if (imageCallMatch) {
    const typePrefix = imageCallMatch[1]?.toLowerCase();
    const argExpr = imageCallMatch[2].trim();
    const val = evaluateScalar(argExpr, env);
    if (val === null) return null;

    if (typeof val === 'boolean') {
      return val ? 'TRUE' : 'FALSE';
    }
    if (typeof val === 'number') {
      if (!Number.isInteger(val) || typePrefix === 'float') {
        const sign = val >= 0 ? ' ' : '';
        return `${sign}${val.toExponential(5).toUpperCase()}`;
      }
      // Standard Ada integer 'Image formats non-negative integers with a leading space
      return val >= 0 ? ` ${val}` : String(val);
    }
    return String(val);
  }

  // 3. Ada 2012 Var'Image attribute
  const varImageMatch = term.match(/^([a-zA-Z_]\w*)'Image$/i);
  if (varImageMatch) {
    const varName = varImageMatch[1].toLowerCase();
    const val = env.get(varName);
    if (val === undefined) return null;
    if (typeof val === 'number') {
      return val >= 0 ? ` ${val}` : String(val);
    }
    if (typeof val === 'boolean') {
      return val ? 'TRUE' : 'FALSE';
    }
    return String(val);
  }

  // 4. Identifier reference
  const lower = term.toLowerCase();
  if (env.has(lower)) {
    const val = env.get(lower);
    return String(val);
  }

  // 5. Standalone scalar literal
  const scalar = evaluateScalar(term, env);
  if (scalar !== null) {
    return String(scalar);
  }

  return null;
}

/**
 * Evaluates an Ada expression (handling string literals, concatenation with '&', and 'Image).
 */
export function evaluateExpression(
  expr: string,
  env: Map<string, number | string | boolean>
): string | null {
  const parts = splitConcatenation(expr);
  let result = '';

  for (const part of parts) {
    const termVal = evaluateTerm(part, env);
    if (termVal === null) {
      return null;
    }
    result += termVal;
  }

  return result;
}

interface Statement {
  type: 'put_line' | 'loop' | 'assignment' | 'null' | 'unknown';
  raw: string;
  varName?: string;
  isReverse?: boolean;
  expr?: string;
  body?: Statement[];
}

/**
 * Parses sequential statements inside the procedure body.
 */
function parseStatements(codeChunk: string): Statement[] | null {
  const statements: Statement[] = [];
  let idx = 0;
  const len = codeChunk.length;

  while (idx < len) {
    // Skip whitespace
    while (idx < len && /\s/.test(codeChunk[idx])) idx++;
    if (idx >= len) break;

    // Check for loop: for <var> in [reverse] <start> .. <end> loop ... end loop;
    const rest = codeChunk.slice(idx);
    const loopMatch = rest.match(
      /^for\s+([a-zA-Z_]\w*)\s+in\s+(reverse\s+)?([\w\d]+)\s*\.\.\s*([\w\d]+)\s+loop\b/i
    );

    if (loopMatch) {
      const varName = loopMatch[1];
      const isReverse = !!loopMatch[2];
      const startStr = loopMatch[3];
      const endStr = loopMatch[4];
      idx += loopMatch[0].length;

      // Find matching "end loop;"
      let loopBody = '';
      let nestedLoops = 1;
      let inStr = false;
      let loopEndIdx = -1;

      for (let j = idx; j < len; j++) {
        const c = codeChunk[j];
        if (c === '"') {
          if (inStr && codeChunk[j + 1] === '"') {
            loopBody += '""';
            j++;
            continue;
          }
          inStr = !inStr;
          loopBody += c;
        } else if (!inStr) {
          const sliceAhead = codeChunk.slice(j);
          if (/^for\b/i.test(sliceAhead)) {
            const innerFor = sliceAhead.match(/^for\s+[a-zA-Z_]\w*\s+in\b[\s\S]*?\bloop\b/i);
            if (innerFor) {
              nestedLoops++;
              loopBody += sliceAhead.slice(0, innerFor[0].length);
              j += innerFor[0].length - 1;
              continue;
            }
          } else if (/^end\s+loop\s*;/i.test(sliceAhead)) {
            nestedLoops--;
            if (nestedLoops === 0) {
              const endMatch = sliceAhead.match(/^end\s+loop\s*;/i)!;
              loopEndIdx = j + endMatch[0].length;
              break;
            } else {
              const endMatch = sliceAhead.match(/^end\s+loop\s*;/i)!;
              loopBody += sliceAhead.slice(0, endMatch[0].length);
              j += endMatch[0].length - 1;
              continue;
            }
          }
          loopBody += c;
        } else {
          loopBody += c;
        }
      }

      if (loopEndIdx === -1) {
        return null;
      }

      idx = loopEndIdx;
      const innerStmts = parseStatements(loopBody);
      if (innerStmts === null) return null;

      statements.push({
        type: 'loop',
        raw: loopMatch[0],
        varName,
        isReverse,
        expr: `${startStr}..${endStr}`,
        body: innerStmts,
      });
      continue;
    }

    // Otherwise read until semicolon ';' outside string literals
    let stmtText = '';
    let inStr = false;
    let foundSemi = false;

    while (idx < len) {
      const c = codeChunk[idx];
      if (c === '"') {
        if (inStr && codeChunk[idx + 1] === '"') {
          stmtText += '""';
          idx += 2;
          continue;
        }
        inStr = !inStr;
        stmtText += c;
        idx++;
      } else if (!inStr && c === ';') {
        foundSemi = true;
        idx++;
        break;
      } else {
        stmtText += c;
        idx++;
      }
    }

    if (!foundSemi && stmtText.trim().length === 0) {
      break;
    }

    const trimmed = stmtText.trim();
    if (!trimmed) continue;

    // Null or Delay statement
    if (/^null$/i.test(trimmed) || /^delay\s+/i.test(trimmed)) {
      statements.push({ type: 'null', raw: trimmed });
      continue;
    }

    // Put_Line statement
    const putLineMatch = trimmed.match(/^(?:Ada\.Text_IO\.)?Put_Line(?:\s*\(([\s\S]*)\))?$/i);
    if (putLineMatch) {
      statements.push({
        type: 'put_line',
        raw: trimmed,
        expr: putLineMatch[1] ? putLineMatch[1].trim() : '""',
      });
      continue;
    }

    // Assignment: Var := Expr
    const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*:=\s*([\s\S]+)$/i);
    if (assignMatch) {
      statements.push({
        type: 'assignment',
        raw: trimmed,
        varName: assignMatch[1],
        expr: assignMatch[2].trim(),
      });
      continue;
    }

    // Unmodeled statement
    statements.push({
      type: 'unknown',
      raw: trimmed,
    });
  }

  return statements;
}

/**
 * Counts the number of Put_Line statements in an AST block.
 */
function countPutLineStatements(stmts: Statement[]): number {
  let count = 0;
  for (const s of stmts) {
    if (s.type === 'put_line') {
      count++;
    } else if (s.type === 'loop' && s.body) {
      count += countPutLineStatements(s.body);
    }
  }
  return count;
}

/**
 * Executes statements sequentially in the given environment.
 */
function executeStatements(
  stmts: Statement[],
  env: Map<string, number | string | boolean>,
  outputLines: string[]
): boolean {
  for (const stmt of stmts) {
    if (stmt.type === 'null') {
      continue;
    }

    if (stmt.type === 'assignment') {
      const varName = stmt.varName!.toLowerCase();
      const val = evaluateScalar(stmt.expr!, env);
      if (val !== null) {
        env.set(varName, val);
      } else {
        const strVal = evaluateExpression(stmt.expr!, env);
        if (strVal !== null) {
          env.set(varName, strVal);
        } else {
          return false;
        }
      }
      continue;
    }

    if (stmt.type === 'put_line') {
      const text = evaluateExpression(stmt.expr!, env);
      if (text === null) {
        return false;
      }
      outputLines.push(text);
      continue;
    }

    if (stmt.type === 'loop') {
      const [startStr, endStr] = stmt.expr!.split('..');
      const startVal = evaluateScalar(startStr, env);
      const endVal = evaluateScalar(endStr, env);
      if (typeof startVal !== 'number' || typeof endVal !== 'number') {
        return false;
      }

      const varName = stmt.varName!.toLowerCase();
      const maxIterations = 500;
      let count = 0;

      if (!stmt.isReverse) {
        for (let i = startVal; i <= endVal; i++) {
          if (++count > maxIterations) return false;
          env.set(varName, i);
          const ok = executeStatements(stmt.body!, env, outputLines);
          if (!ok) return false;
        }
      } else {
        for (let i = endVal; i >= startVal; i--) {
          if (++count > maxIterations) return false;
          env.set(varName, i);
          const ok = executeStatements(stmt.body!, env, outputLines);
          if (!ok) return false;
        }
      }
      continue;
    }

    // Unknown or unmodeled statement
    return false;
  }

  return true;
}

/**
 * Checks if code contains concurrency keywords outside strings and comments.
 */
export function hasConcurrencyKeywords(code: string): boolean {
  const stripped = code
    .replace(/"(?:""|[^"\r\n])*"/g, '""')
    .replace(/--.*$/gm, '');
  return /\b(task|protected|entry|accept)\b/i.test(stripped);
}

/**
 * Interprets simple custom sequential Ada code containing Put_Line statements.
 * Returns { success: true, lines } on successful simulation,
 * or { success: false, lines: [] } if unmodeled constructs or no Put_Line calls are found.
 */
export function interpretPutLine(code: string): {
  success: boolean;
  lines: string[];
  hasConcurrency?: boolean;
} {
  // Concurrency check: unmodeled custom concurrent code cannot be scheduled
  if (hasConcurrencyKeywords(code)) {
    return { success: false, lines: [], hasConcurrency: true };
  }

  const cleanCode = code.replace(/--.*$/gm, '');
  const beginMatch = cleanCode.match(/\bbegin\b/i);
  if (!beginMatch || beginMatch.index === undefined) {
    return { success: false, lines: [] };
  }

  const beginIdx = beginMatch.index + beginMatch[0].length;
  const declCode = cleanCode.slice(0, beginMatch.index);
  const bodyCode = cleanCode.slice(beginIdx);

  // Strip trailing 'end [Name];'
  const endMatch = bodyCode.match(/\bend(?:\s+[a-zA-Z_]\w*)?\s*;\s*$/i);
  const executableCode = endMatch && endMatch.index !== undefined
    ? bodyCode.slice(0, endMatch.index)
    : bodyCode;

  // Initialize environment and parse declarative constants/variables
  const env = new Map<string, number | string | boolean>();
  const varRegex = /([a-zA-Z_]\w*)\s*:\s*(?:constant\s+)?(?:[a-zA-Z_]\w*)?\s*:=\s*([^;]+);/gi;
  let m: RegExpExecArray | null;

  while ((m = varRegex.exec(declCode)) !== null) {
    const name = m[1].toLowerCase();
    const rawVal = m[2].trim();
    if (rawVal.startsWith('"') && rawVal.endsWith('"')) {
      env.set(name, rawVal.slice(1, -1).replace(/""/g, '"'));
    } else if (rawVal.toLowerCase() === 'true') {
      env.set(name, true);
    } else if (rawVal.toLowerCase() === 'false') {
      env.set(name, false);
    } else {
      const scalar = evaluateScalar(rawVal, env);
      if (scalar !== null) {
        env.set(name, scalar);
      }
    }
  }

  const stmts = parseStatements(executableCode);
  if (!stmts || stmts.length === 0) {
    return { success: false, lines: [] };
  }

  // Ensure at least one Put_Line statement exists
  const putLineCount = countPutLineStatements(stmts);
  if (putLineCount === 0) {
    return { success: false, lines: [] };
  }

  const outputLines: string[] = [];
  const ok = executeStatements(stmts, env, outputLines);
  if (!ok) {
    return { success: false, lines: [] };
  }

  return { success: true, lines: outputLines };
}

/**
 * Streams preprogrammed example outputs and synchronizes TaskEvents.
 */
async function streamExample(
  example: Example,
  options: RunOptions,
  signal: AbortSignal,
  lineDelayMs: number
): Promise<void> {
  const rawLines = example.expectedOutput.split(/\r?\n/);
  const lines = rawLines.length > 0 && rawLines[rawLines.length - 1] === ''
    ? rawLines.slice(0, -1)
    : rawLines;

  const taskEvents: TaskEvent[] = example.taskEvents
    ? [...example.taskEvents].sort((a, b) => a.timestamp - b.timestamp)
    : [];

  const maxTimestamp = taskEvents.length > 0
    ? Math.max(1, taskEvents[taskEvents.length - 1].timestamp)
    : 1;

  let eventIdx = 0;

  // Emit initial task events (timestamp 0)
  while (eventIdx < taskEvents.length && taskEvents[eventIdx].timestamp === 0) {
    options.onTaskEvent?.(taskEvents[eventIdx]);
    eventIdx++;
  }

  if (lines.length > 0) {
    for (let i = 0; i < lines.length; i++) {
      await sleep(lineDelayMs, signal);

      // Emit task events scheduled up to this point in time
      const targetFraction = (i + 1) / lines.length;
      const targetTime = targetFraction * maxTimestamp;

      while (eventIdx < taskEvents.length && taskEvents[eventIdx].timestamp <= targetTime) {
        options.onTaskEvent?.(taskEvents[eventIdx]);
        eventIdx++;
      }

      options.onOutput({
        stream: 'stdout',
        text: lines[i],
      });
    }
  } else {
    // No output lines, but task events exist
    for (; eventIdx < taskEvents.length; eventIdx++) {
      await sleep(100, signal);
      options.onTaskEvent?.(taskEvents[eventIdx]);
    }
  }

  // Flush any remaining task events
  while (eventIdx < taskEvents.length) {
    options.onTaskEvent?.(taskEvents[eventIdx]);
    eventIdx++;
  }
}

/**
 * Streams sequential lines of text to onOutput.
 */
async function streamLines(
  lines: string[],
  options: RunOptions,
  signal: AbortSignal,
  lineDelayMs: number
): Promise<void> {
  for (const line of lines) {
    await sleep(lineDelayMs, signal);
    options.onOutput({
      stream: 'stdout',
      text: line,
    });
  }
}

/**
 * Concrete implementation of the decoupled CompilerService interface.
 */
export const compilerService: CompilerService = {
  /**
   * Compiles Ada code using the client-side linter.
   */
  async compile(code: string): Promise<CompileResult> {
    const diagnostics = lintAda(code);
    if (diagnostics.length > 0) {
      return {
        success: false,
        errors: diagnostics,
        warnings: [],
      };
    }
    return {
      success: true,
      errors: [],
      warnings: [],
    };
  },

  /**
   * Runs the Ada simulation runtime:
   * - Emits initial Plan B banner.
   * - Sets up 10s timeout and AbortSignal cancellation.
   * - Checks for example match.
   * - Otherwise runs Put_Line interpreter or displays fallback notice.
   */
  async run(
    code: string,
    options: RunOptions
  ): Promise<{ exitCode: number; stoppedByUser?: boolean }> {
    const combinedController = new AbortController();
    let userStopped = false;
    let timedOut = false;

    // Handle user abort signal
    if (options.signal) {
      if (options.signal.aborted) {
        userStopped = true;
        combinedController.abort();
      } else {
        options.signal.addEventListener(
          'abort',
          () => {
            userStopped = true;
            combinedController.abort();
          },
          { once: true }
        );
      }
    }

    // Set 10-second execution timeout (or configurable via options)
    const timeoutMs = (options as any).timeoutMs ?? EXECUTION_TIMEOUT_MS;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      combinedController.abort();
    }, timeoutMs);

    const lineDelayMs = (options as any).lineDelayMs ?? DEFAULT_LINE_DELAY_MS;

    try {
      // 1. Initial banner
      options.onOutput({
        stream: 'system',
        text: '[Simulation Mode] Plan B Runtime',
      });

      // Immediate check if aborted
      if (combinedController.signal.aborted) {
        if (userStopped) {
          options.onOutput({
            stream: 'warning',
            text: '⏹ Execution stopped by user',
          });
          return { exitCode: 130, stoppedByUser: true };
        }
      }

      // 2. Smart Example Matching
      const matchedExample = findMatchingExample(code, options);

      if (matchedExample) {
        await streamExample(matchedExample, options, combinedController.signal, lineDelayMs);

        options.onOutput({
          stream: 'banner-success',
          text: '✓ Program exited with code 0',
        });
        return { exitCode: 0 };
      }

      // 3. Custom Code: First verify syntax compilation
      const compileResult = await this.compile(code);
      if (!compileResult.success) {
        options.onOutput({
          stream: 'banner-error',
          text: `✗ Compilation failed (${compileResult.errors.length} error${
            compileResult.errors.length > 1 ? 's' : ''
          })`,
        });

        for (const err of compileResult.errors) {
          options.onOutput({
            stream: 'stderr',
            text: `[ERROR] line ${err.line}:${err.col} — ${err.message}`,
          });
        }

        return { exitCode: 1 };
      }

      // 4. Sequential Put_Line Interpreter
      const interpResult = interpretPutLine(code);

      if (interpResult.success && interpResult.lines.length > 0) {
        await streamLines(interpResult.lines, options, combinedController.signal, lineDelayMs);

        options.onOutput({
          stream: 'banner-success',
          text: '✓ Program exited with code 0',
        });
        return { exitCode: 0 };
      }

      // 5. Unmodeled arbitrary code or code without Put_Line
      options.onOutput({
        stream: 'warning',
        text: '[Simulation Mode] ⚠ Execution output not available for custom code in simulation mode.',
      });
      options.onOutput({
        stream: 'system',
        text: 'Tip: Select an example from the library to explore concurrent simulation and task event timelines.',
      });

      return { exitCode: 0 };
    } catch (err: unknown) {
      if (userStopped || (err instanceof DOMException && err.name === 'AbortError' && !timedOut)) {
        options.onOutput({
          stream: 'warning',
          text: '⏹ Execution stopped by user',
        });
        return { exitCode: 130, stoppedByUser: true };
      }

      if (timedOut) {
        options.onOutput({
          stream: 'banner-error',
          text: '⏱ Execution timed out after 10s',
        });
        return { exitCode: 1 };
      }

      // Unexpected error
      const message = err instanceof Error ? err.message : String(err);
      options.onOutput({
        stream: 'stderr',
        text: `Runtime exception: ${message}`,
      });
      return { exitCode: 1 };
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

export default compilerService;
