import type * as monaco from 'monaco-editor';

export const ADA_LANGUAGE_ID = 'ada';

export const adaLanguageDef: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  ignoreCase: true,
  tokenPostfix: '.ada',

  keywords: [
    'abort', 'abs', 'abstract', 'accept', 'access', 'aliased', 'all', 'and', 'array',
    'at', 'begin', 'body', 'case', 'constant', 'declare', 'delay', 'delta', 'digits',
    'do', 'else', 'elsif', 'end', 'entry', 'exception', 'exit', 'for', 'function',
    'generic', 'goto', 'if', 'in', 'interface', 'is', 'limited', 'loop', 'mod',
    'new', 'not', 'null', 'of', 'or', 'others', 'out', 'overriding', 'package',
    'pragma', 'private', 'procedure', 'protected', 'raise', 'range', 'record',
    'rem', 'renames', 'requeue', 'return', 'reverse', 'select', 'separate', 'some',
    'subtype', 'synchronized', 'tagged', 'task', 'terminate', 'then', 'type',
    'until', 'use', 'when', 'while', 'with', 'xor'
  ],

  taskKeywords: [
    'task', 'entry', 'accept', 'select', 'delay', 'terminate',
    'protected', 'requeue', 'abort', 'synchronized'
  ],

  typeKeywords: [
    'boolean', 'integer', 'natural', 'positive', 'float', 'character',
    'wide_character', 'wide_wide_character', 'string', 'wide_string',
    'wide_wide_string', 'duration', 'time', 'time_span', 'standard',
    'long_integer', 'long_float', 'short_integer', 'short_float'
  ],

  operators: [
    '+', '-', '*', '/', '**', '=', '/=', '<', '<=', '>', '>=',
    ':=', '=>', '..', '<>', '&'
  ],

  tokenizer: {
    root: [
      // Line comments: -- to end of line
      [/--.*$/, 'comment'],

      // Whitespace
      [/[ \t\r\n]+/, 'white'],

      // Pragmas with directive name (e.g. pragma Atomic, pragma Priority)
      [/pragma\s+([a-zA-Z_]\w*)/i, ['keyword', 'meta.pragma']],

      // Character literals: e.g. 'a', '''' for quote, '"', ' '
      [/''''/, 'string.character'],
      [/'[^']'/, 'string.character'],

      // Attribute ticks (e.g. 'Image, 'Terminated, 'Count, 'Length, 'Range, 'Val)
      [/'[a-zA-Z_]\w*/, 'variable.predefined'],

      // Strings (with escaped double-quotes "")
      [/"([^"\n]|"")*"/, 'string'],
      [/"([^"\n]|"")*$/, 'string.invalid'],

      // Numbers: based literals (e.g. 16#FF#, 2#1010_0101#, 16#12.AB#E+2)
      [/\d[\d_]*#[0-9a-fA-F_]+(\.[0-9a-fA-F_]+)?#([eE][+-]?\d[\d_]*)?/, 'number.hex'],
      // Numbers: floating point (e.g. 123.456, 0.5, 1.0e-3)
      [/\d[\d_]*\.\d[\d_]*([eE][+-]?\d[\d_]*)?/, 'number.float'],
      // Numbers: decimal integers (e.g. 100, 1_000_000)
      [/\d[\d_]*([eE][+-]?\d[\d_]*)?/, 'number'],

      // Word brackets: begin / end annotated with @open and @close
      [/\bbegin\b/i, { token: 'keyword.begin', bracket: '@open' }],
      [/\bend\b/i, { token: 'keyword.end', bracket: '@close' }],

      // Standard brackets
      [/[()]/, '@brackets'],
      [/[\[\]]/, '@brackets'],

      // Identifiers & Keywords
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@taskKeywords': 'keyword.task',
          '@typeKeywords': 'type',
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],

      // Compound delimiters and operators
      [/(:=|=>|\.\.|\*\*|\/=|\<=|\>=|<>)/, 'operator'],
      [/[:;,.]/, 'delimiter'],
      [/[+\-*/=<>|&]/, 'operator'],
    ]
  }
};

export const adaMonarchTokens = adaLanguageDef;

export const adaLanguageConfig: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '--',
  },
  brackets: [
    ['begin', 'end'],
    ['(', ')'],
    ['[', ']']
  ],
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '"', close: '"', notIn: ['string', 'comment'] }
  ],
  surroundingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '"', close: '"' }
  ],
  indentationRules: {
    increaseIndentPattern: /^\s*(\b(is|begin|then|else|elsif|loop|declare|do|record|select|exception)\b|.*\b(is|begin|then|else|elsif|loop|declare|do|record|select|exception))\s*(--.*)?$/i,
    decreaseIndentPattern: /^\s*\b(end|else|elsif|when|exception)\b/i
  }
};

export function registerAdaLanguage(monacoInstance: typeof monaco): void {
  if (!monacoInstance.languages.getLanguages().some((lang) => lang.id === ADA_LANGUAGE_ID)) {
    monacoInstance.languages.register({
      id: ADA_LANGUAGE_ID,
      aliases: ['Ada', 'ada'],
      extensions: ['.adb', '.ads'],
      mimetypes: ['text/x-ada']
    });
    monacoInstance.languages.setMonarchTokensProvider(ADA_LANGUAGE_ID, adaLanguageDef);
    monacoInstance.languages.setLanguageConfiguration(ADA_LANGUAGE_ID, adaLanguageConfig);
  }
}
