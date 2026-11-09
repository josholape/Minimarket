import { useEffect, useState } from 'react';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme');

    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Browser storage may be unavailable.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Switching still works without saving the preference.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Dark mode"
      aria-pressed={theme === 'dark'}
      className="rounded-lg border border-outline bg-surface-input px-3 py-2 text-sm font-medium text-content-main hover:text-accent"
    >
      {theme === 'dark' ? '☀ Light mode' : '☾ Dark mode'}
    </button>
  );
}