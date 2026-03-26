/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        navy: {
          DEFAULT: '#0f172a',
          800: '#1e293b',
          700: '#253047',
          600: '#2d3a50',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          400: '#22d3ee',
          600: '#0891b2',
        },
      },
    },
  },
  plugins: [],
};