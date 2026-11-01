/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        navbar: 'var(--bg-navbar)',
        panel: 'var(--bg-panel)',
        'panel-subtle': 'var(--bg-panel-subtle)',
        gutter: 'var(--bg-gutter)',
        'gutter-hover': 'var(--bg-gutter-hover)',
        'border-theme': 'var(--border-color)',
        'border-subtle': 'var(--border-subtle)',
        'txt-primary': 'var(--text-primary)',
        'txt-secondary': 'var(--text-secondary)',
        'txt-muted': 'var(--text-muted)',
        'console-bg': 'var(--console-bg)',
        'console-txt': 'var(--console-text)',
        theme: {
          bg: 'var(--bg-primary)',
          surface: 'var(--bg-secondary)',
          elevated: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
          border: 'var(--border-color)',
          text: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          accent: 'var(--accent-color)',
          'accent-hover': 'var(--accent-hover)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
