import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#ba0a00',
          black: '#0b0b0b',
          gray: '#eaeaea',
        },
      },
      boxShadow: {
        soft: '0 8px 24px rgba(11,11,11,0.08), 0 1px 2px rgba(11,11,11,0.06)',
        lift: '0 18px 44px rgba(11,11,11,0.14), 0 2px 6px rgba(186,10,0,0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
