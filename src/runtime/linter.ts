import type * as monaco from 'monaco-editor';
import type { LintDiagnostic } from '../types';

export interface LinterToken {
  type:
    | 'KEYWORD'
    | 'IDENTIFIER'
    | 'STRING'
    | 'CHAR'
    | 'ATTR'
    | 'NUMBER'
    | 'SYMBOL'
    | 'SEMICOLON'
    | 'OPEN_PAREN'
    | 'CLOSE_PAREN';
  value: string;
  line: number;
  col: number;
  endCol: number;
}

interface ParenLocation {
  line: number;
  col: number;
}

interface ScopeEntry {
  type: 'TASK_SPEC' | 'PROTECTED_SPEC' | 'PROTECTED_BODY' | 'PACKAGE_SPEC' | 'ACCEPT';
  name: string;
  line: number;
  col: number;
}

interface TaskDecl {
  name: string;
  line: number;
  col: number;
}

/**
 * Client-side Ada syntax validator that tokenizes Ada source code
 * and detects syntax errors without naive multiline regex pitfalls.
 */
export function lintAda(code: string): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const lines = code.split('\n');

  const tokens: LinterToken[] = [];
  const parenStack: ParenLocation[] = [];
  const tokensByLine: Map<number, LinterToken[]> = new Map();

  // STEP 1: Lexical scanner
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1;
    const lineText = lines[lineIdx];
    let col = 0;
    const lineTokens: LinterToken[] = [];

    while (col < lineText.length) {
      const char = lineText[col];

      // Whitespace
      if (char === ' ' || char === '\t' || char === '\r') {
        col++;
        continue;
      }

      // Line comments: -- to end of line
      if (char === '-' && lineText[col + 1] === '-') {
        break; // Ignore rest of the line
      }

      // String literals: "..." with "" escaped quote support
      if (char === '"') {
        const startCol = col + 1;
        let strIdx = col + 1;
        let closed = false;

        while (strIdx < lineText.length) {
          if (lineText[strIdx] === '"') {
            if (lineText[strIdx + 1] === '"') {
              // Escaped double-quote inside string
              strIdx += 2;
              continue;
            } else {
              closed = true;
              strIdx++;
              break;
            }
          }
          strIdx++;
        }

        if (!closed) {
          diagnostics.push({
            line: lineNum,
            col: startCol,
            message: 'Unclosed string literal',
            code: 'unclosed_string',
          });
          col = lineText.length;
        } else {
          const strVal = lineText.slice(col, strIdx);
          const tok: LinterToken = {
            type: 'STRING',
            value: strVal,
            line: lineNum,
            col: startCol,
            endCol: strIdx + 1,
          };
          tokens.push(tok);
          lineTokens.push(tok);
          col = strIdx;
        }
        continue;
      }

      // Character literals vs Attribute ticks
      if (char === "'") {
        // Special case: '''' (character literal for single quote)
        if (lineText.slice(col, col + 4) === "''''") {
          const tok: LinterToken = {
            type: 'CHAR',
            value: "''''",
            line: lineNum,
            col: col + 1,
            endCol: col + 5,
          };
          tokens.push(tok);
          lineTokens.push(tok);
          col += 4;
          continue;
        }

        // Single character literal: 'c'
        if (lineText[col + 2] === "'") {
          const charVal = lineText.slice(col, col + 3);
          const tok: LinterToken = {
            type: 'CHAR',
            value: charVal,
            line: lineNum,
            col: col + 1,
            endCol: col + 4,
          };
          tokens.push(tok);
          lineTokens.push(tok);
          col += 3;
          continue;
        }

        // Attribute tick: 'Image, 'Terminated, 'Length, etc.
        const rest = lineText.slice(col + 1);
        const attrMatch = rest.match(/^[a-zA-Z_]\w*/);
        if (attrMatch) {
          const tok: LinterToken = {
            type: 'ATTR',
            value: "'" + attrMatch[0],
            line: lineNum,
            col: col + 1,
            endCol: col + 1 + 1 + attrMatch[0].length,
          };
          tokens.push(tok);
          lineTokens.push(tok);
          col += 1 + attrMatch[0].length;
          continue;
        }
      }

      // Parentheses
      if (char === '(') {
        parenStack.push({ line: lineNum, col: col + 1 });
        const tok: LinterToken = {
          type: 'OPEN_PAREN',
          value: '(',
          line: lineNum,
          col: col + 1,
          endCol: col + 2,
        };
        tokens.push(tok);
        lineTokens.push(tok);
        col++;
        continue;
      }

      if (char === ')') {
        if (parenStack.length === 0) {
          diagnostics.push({
            line: lineNum,
            col: col + 1,
            message: "Unmatched closing parenthesis ')'",
            code: 'unbalanced_parentheses',
          });
        } else {
          parenStack.pop();
        }
        const tok: LinterToken = {
          type: 'CLOSE_PAREN',
          value: ')',
          line: lineNum,
          col: col + 1,
          endCol: col + 2,
        };
        tokens.push(tok);
        lineTokens.push(tok);
        col++;
        continue;
      }

      // Semicolon
      if (char === ';') {
        const tok: LinterToken = {
          type: 'SEMICOLON',
          value: ';',
          line: lineNum,
          col: col + 1,
          endCol: col + 2,
        };
        tokens.push(tok);
        lineTokens.push(tok);
        col++;
        continue;
      }

      // Based numbers and standard numbers
      if (char >= '0' && char <= '9') {
        const rest = lineText.slice(col);
        const basedMatch = rest.match(/^\d[\d_]*#[0-9a-fA-F_]+(\.[0-9a-fA-F_]+)?#([eE][+-]?\d[\d_]*)?/);
        const floatMatch = !basedMatch ? rest.match(/^\d[\d_]*\.\d[\d_]*([eE][+-]?\d[\d_]*)?/) : null;
        const intMatch = !basedMatch && !floatMatch ? rest.match(/^\d[\d_]*([eE][+-]?\d[\d_]*)?/) : null;

        const numMatch = basedMatch || floatMatch || intMatch;
        if (numMatch) {
          const tok: LinterToken = {
            type: 'NUMBER',
            value: numMatch[0],
            line: lineNum,
            col: col + 1,
            endCol: col + 1 + numMatch[0].length,
          };
          tokens.push(tok);
          lineTokens.push(tok);
          col += numMatch[0].length;
          continue;
        }
      }

      // Identifiers and Keywords
      if (/[a-zA-Z_]/.test(char)) {
        const rest = lineText.slice(col);
        const wordMatch = rest.match(/^[a-zA-Z_]\w*/);
        if (wordMatch) {
          const word = wordMatch[0];
          const tok: LinterToken = {
            type: 'KEYWORD',
            value: word,
            line: lineNum,
            col: col + 1,
            endCol: col + 1 + word.length,
          };
          tokens.push(tok);
          lineTokens.push(tok);
          col += word.length;
          continue;
        }
      }

      // Multi-character operators: :=, =>, .., **, /=, <=, >=, <>
      const rest2 = lineText.slice(col, col + 2);
      if ([':=', '=>', '..', '**', '/=', '<=', '>=', '<>'].includes(rest2)) {
        const tok: LinterToken = {
          type: 'SYMBOL',
          value: rest2,
          line: lineNum,
          col: col + 1,
          endCol: col + 3,
        };
        tokens.push(tok);
        lineTokens.push(tok);
        col += 2;
        continue;
      }

      // Single-character symbols and operators
      const tok: LinterToken = {
        type: 'SYMBOL',
        value: char,
        line: lineNum,
        col: col + 1,
        endCol: col + 2,
      };
      tokens.push(tok);
      lineTokens.push(tok);
      col++;
    }

    if (lineTokens.length > 0) {
      tokensByLine.set(lineNum, lineTokens);
    }
  }

  // STEP 2: Check residual unclosed parentheses
  while (parenStack.length > 0) {
    const p = parenStack.pop()!;
    diagnostics.push({
      line: p.line,
      col: p.col,
      message: `Unclosed parenthesis '(' opened at line ${p.line}`,
      code: 'unbalanced_parentheses',
    });
  }

  // STEP 3: Task Declarations vs Task Bodies
  const taskDeclarations = new Map<string, TaskDecl>();
  const taskBodies = new Set<string>();

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const valLower = tok.value.toLowerCase();

    if (valLower === 'task') {
      const next1 = tokens[i + 1];
      const next1Lower = next1?.value.toLowerCase();
      const next2 = tokens[i + 2];

      if (next1Lower === 'body' && next2) {
        taskBodies.add(next2.value.toLowerCase());
      } else if (next1Lower === 'type' && next2) {
        taskDeclarations.set(next2.value.toLowerCase(), {
          name: next2.value,
          line: tok.line,
          col: tok.col,
        });
      } else if (next1 && next1Lower !== 'body' && next1Lower !== 'type') {
        // Could be `task Worker;` or `task Servidor is` or `task T1, T2;`
        let j = i + 1;
        while (j < tokens.length) {
          const t = tokens[j];
          if (t.type === 'KEYWORD' || t.type === 'IDENTIFIER') {
            const tLower = t.value.toLowerCase();
            if (tLower === 'is') break;
            taskDeclarations.set(tLower, {
              name: t.value,
              line: tok.line,
              col: tok.col,
            });
            if (tokens[j + 1]?.value === ',') {
              j += 2;
              continue;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
    }
  }

  // Report tasks declared without a body
  for (const [nameLower, decl] of taskDeclarations) {
    if (!taskBodies.has(nameLower)) {
      diagnostics.push({
        line: decl.line,
        col: decl.col,
        message: `Task '${decl.name}' declared at line ${decl.line} has no corresponding 'task body ${decl.name}'`,
        code: 'task_without_body',
      });
    }
  }

  // STEP 4: Begin / End Matching with Specification Disambiguation
  const beginStack: Array<{ line: number; col: number }> = [];
  const specStack: ScopeEntry[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const valLower = tok.value.toLowerCase();

    // 4a. Track Specification blocks & Accept blocks
    if (valLower === 'task') {
      const prev = tokens[i - 1]?.value.toLowerCase();
      if (prev !== 'end') {
        const next1 = tokens[i + 1]?.value.toLowerCase();
        if (next1 === 'body') {
          // Task body - has executable begin/end, not a spec block
        } else if (next1 === 'type') {
          const nameTok = tokens[i + 2];
          const isTok = tokens[i + 3]?.value.toLowerCase();
          if (nameTok && isTok === 'is') {
            specStack.push({
              type: 'TASK_SPEC',
              name: nameTok.value.toLowerCase(),
              line: tok.line,
              col: tok.col,
            });
          }
        } else if (next1) {
          const nameTok = tokens[i + 1];
          const isTok = tokens[i + 2]?.value.toLowerCase();
          if (nameTok && isTok === 'is') {
            specStack.push({
              type: 'TASK_SPEC',
              name: nameTok.value.toLowerCase(),
              line: tok.line,
              col: tok.col,
            });
          }
        }
      }
    } else if (valLower === 'protected') {
      const prev = tokens[i - 1]?.value.toLowerCase();
      if (prev !== 'end') {
        const next1 = tokens[i + 1]?.value.toLowerCase();
        if (next1 === 'body') {
          const nameTok = tokens[i + 2];
          if (nameTok) {
            specStack.push({
              type: 'PROTECTED_BODY',
              name: nameTok.value.toLowerCase(),
              line: tok.line,
              col: tok.col,
            });
          }
        } else if (next1 === 'type') {
          const nameTok = tokens[i + 2];
          if (nameTok) {
            specStack.push({
              type: 'PROTECTED_SPEC',
              name: nameTok.value.toLowerCase(),
              line: tok.line,
              col: tok.col,
            });
          }
        } else if (next1) {
          specStack.push({
            type: 'PROTECTED_SPEC',
            name: next1,
            line: tok.line,
            col: tok.col,
          });
        }
      }
    } else if (valLower === 'package') {
      const prev = tokens[i - 1]?.value.toLowerCase();
      if (prev !== 'end') {
        const next1 = tokens[i + 1]?.value.toLowerCase();
        if (next1 !== 'body' && next1) {
          specStack.push({
            type: 'PACKAGE_SPEC',
            name: next1,
            line: tok.line,
            col: tok.col,
          });
        }
      }
    } else if (valLower === 'accept') {
      const prev = tokens[i - 1]?.value.toLowerCase();
      if (prev !== 'end') {
        const next1 = tokens[i + 1];
        if (next1) {
          // Scan ahead to verify it has `do`, tracking parenthesis depth for parameters
          let j = i + 1;
          let hasDo = false;
          let pDepth = 0;
          while (j < tokens.length) {
            const tj = tokens[j];
            if (tj.type === 'OPEN_PAREN') {
              pDepth++;
            } else if (tj.type === 'CLOSE_PAREN') {
              pDepth = Math.max(0, pDepth - 1);
            } else if (pDepth === 0) {
              if (tj.value === ';') {
                break; // Standalone accept without do
              }
              if (tj.value.toLowerCase() === 'do') {
                hasDo = true;
                break;
              }
            }
            j++;
          }
          if (hasDo) {
            specStack.push({
              type: 'ACCEPT',
              name: next1.value.toLowerCase(),
              line: tok.line,
              col: tok.col,
            });
          }
        }
      }
    }

    // 4b. Executable `begin`
    if (valLower === 'begin') {
      beginStack.push({ line: tok.line, col: tok.col });
    }

    // 4c. Handling `end`
    if (valLower === 'end') {
      const nextTok = tokens[i + 1];
      const nextLower = nextTok?.value.toLowerCase();

      // Check if it's a control structure end: end if, end loop, end record, end select, end case
      const isControlEnd =
        nextLower && ['if', 'loop', 'record', 'select', 'case'].includes(nextLower);

      if (isControlEnd) {
        // Control end, does not close a begin block
        continue;
      }

      // Check if it closes an active specification or accept block from specStack
      let matchedSpecIdx = -1;
      if (nextLower) {
        for (let s = specStack.length - 1; s >= 0; s--) {
          if (specStack[s].name === nextLower) {
            matchedSpecIdx = s;
            break;
          }
        }
      } else if (specStack.length > 0 && specStack[specStack.length - 1].type === 'ACCEPT') {
        // Anonymous `end;` closing accept block
        matchedSpecIdx = specStack.length - 1;
      }

      if (matchedSpecIdx !== -1) {
        // Closed the specification / accept block
        specStack.splice(matchedSpecIdx, 1);
        continue;
      }

      // Otherwise, this `end` is closing an executable `begin` block
      if (beginStack.length > 0) {
        beginStack.pop();
      } else {
        diagnostics.push({
          line: tok.line,
          col: tok.col,
          message: "Unmatched 'end' without preceding 'begin'",
          code: 'unbalanced_begin_end',
        });
      }
    }
  }

  // Report residual unclosed `begin`
  while (beginStack.length > 0) {
    const unclosed = beginStack.pop()!;
    diagnostics.push({
      line: unclosed.line,
      col: unclosed.col,
      message: `Missing 'end' for 'begin' at line ${unclosed.line}`,
      code: 'unbalanced_begin_end',
    });
  }

  // STEP 5: Missing Semicolon Detection
  // Evaluates statement termination at parenthesis depth 0, ignoring continuation lines.
  const blockOpeners = new Set([
    'is',
    'begin',
    'declare',
    'then',
    'else',
    'elsif',
    'loop',
    'do',
    'select',
    'or',
    'record',
    'exception',
    'generic',
    'private',
    'limited',
    'tagged',
    'when',
  ]);

  const continuationOperators = new Set([
    '+',
    '-',
    '*',
    '/',
    '**',
    '&',
    ':=',
    '=>',
    '..',
    '=',
    '/=',
    '<',
    '<=',
    '>',
    '>=',
    '|',
    ',',
    '(',
    '[',
    'and',
    'or',
    'xor',
    'not',
    'in',
    'of',
    'with',
  ]);

  const sortedLineNums = Array.from(tokensByLine.keys()).sort((a, b) => a - b);
  let currentParenDepth = 0;

  for (let l = 0; l < sortedLineNums.length; l++) {
    const lineNum = sortedLineNums[l];
    const lineTokens = tokensByLine.get(lineNum)!;

    // Calculate paren depth progression on this line
    for (const tok of lineTokens) {
      if (tok.type === 'OPEN_PAREN') currentParenDepth++;
      if (tok.type === 'CLOSE_PAREN') currentParenDepth = Math.max(0, currentParenDepth - 1);
    }

    // If line ends while inside parentheses, it's a multi-line parameter list / expression
    if (currentParenDepth > 0) {
      continue;
    }

    const lastTok = lineTokens[lineTokens.length - 1];

    // If the line terminates with a semicolon, statement is properly ended
    if (lastTok.type === 'SEMICOLON') {
      continue;
    }

    const lastValLower = lastTok.value.toLowerCase();
    const prevTokOnLine = lineTokens.length > 1 ? lineTokens[lineTokens.length - 2] : null;
    const prevValLower = prevTokOnLine ? prevTokOnLine.value.toLowerCase() : null;

    // Check if the line ends with a control structure `end`: e.g. `end loop`, `end if`, `end record`, `end select`
    // These require semicolons!
    const isControlStructureEnd =
      prevValLower === 'end' && ['loop', 'if', 'record', 'select', 'case'].includes(lastValLower);

    // If it's a recognized block opener (and NOT an `end loop` / `end if`), no semicolon needed
    if (!isControlStructureEnd && blockOpeners.has(lastValLower)) {
      continue;
    }

    // If it ends with a continuation operator or symbol, no semicolon needed
    if (continuationOperators.has(lastValLower) || continuationOperators.has(lastTok.value)) {
      continue;
    }

    // Inspect next token in following lines to check for continuation vs new statement
    let nextTok: LinterToken | null = null;
    if (l + 1 < sortedLineNums.length) {
      const nextLineTokens = tokensByLine.get(sortedLineNums[l + 1])!;
      if (nextLineTokens.length > 0) {
        nextTok = nextLineTokens[0];
      }
    }

    // If next line starts with a binary operator, it's a continuation of the previous expression
    if (nextTok) {
      const nextValLower = nextTok.value.toLowerCase();
      if (
        ['+', '-', '*', '/', '&', 'and', 'or', 'xor'].includes(nextValLower) ||
        ['+', '-', '*', '/', '&'].includes(nextTok.value)
      ) {
        continue;
      }
    }

    // Otherwise, a statement or block end was left without a semicolon
    diagnostics.push({
      line: lastTok.line,
      col: lastTok.endCol,
      message: "Missing ';' at end of statement",
      code: 'missing_semicolon',
    });
  }

  // Sort diagnostics top-to-bottom, left-to-right
  return diagnostics.sort((a, b) => a.line - b.line || a.col - b.col);
}

/**
 * Updates Monaco editor model markers for client-side Ada linter errors.
 */
export function updateModelMarkers(
  monacoInstance: typeof monaco,
  model: monaco.editor.ITextModel,
  diagnostics: LintDiagnostic[]
): void {
  const markers: monaco.editor.IMarkerData[] = diagnostics.map((d) => {
    const endLine = (d as any).endLine ?? d.line;
    let endCol = (d as any).endCol ?? (d as any).endColumn ?? (d.col + 4);
    if (endLine === d.line && endCol <= d.col) {
      endCol = d.col + 1;
    }

    return {
      severity: monacoInstance.MarkerSeverity.Error,
      message: d.message,
      startLineNumber: d.line,
      startColumn: d.col,
      endLineNumber: endLine,
      endColumn: endCol,
      source: 'ada-linter',
      code: d.code,
    };
  });

  monacoInstance.editor.setModelMarkers(model, 'ada-linter', markers);
}
