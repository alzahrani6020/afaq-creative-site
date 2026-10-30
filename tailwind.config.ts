import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        afaq: {
          bg: '#0A0E1A',
          blue: '#0b5aa2',
          blue2: '#0f6fc6',
          teal: '#09a6bd',
          gold: '#c5a259',
          gold2: '#e8c97a',
          purple: '#8B5CF6',
          pink: '#EC4899',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Tajawal', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
