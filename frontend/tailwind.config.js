/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050B18',
          900: '#0A1730',
          800: '#102244',
          700: '#173058',
          600: '#204073',
          500: '#2C5391',
        },
        status: {
          low: '#3E7C57',
          medium: '#B8862F',
          high: '#C25A2C',
          critical: '#B23A3A',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
