/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B5CAD',
          50: '#E8F0F9',
          100: '#C5D9F0',
          200: '#9EC0E5',
          300: '#77A7DA',
          400: '#5090D0',
          500: '#0B5CAD',
          600: '#094E95',
          700: '#07407C',
          800: '#053264',
          900: '#03244B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

