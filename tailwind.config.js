/** @type {import('tailwindcss').Config} */
export default {
  // We toggle theme by adding/removing the `dark` class on <html> (see ThemeContext).
  // Tailwind defaults to `prefers-color-scheme` unless configured.
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};


