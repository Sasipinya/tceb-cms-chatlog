'use client';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--surface-2)',
        cursor: 'pointer',
        transition: 'all 0.18s',
        color: 'var(--text-secondary)',
        flexShrink: 0,
      }}
    >
      {theme === 'light'
        ? <Moon className="h-4 w-4" />
        : <Sun className="h-4 w-4" style={{ color: '#fbbf24' }} />}
    </button>
  );
}