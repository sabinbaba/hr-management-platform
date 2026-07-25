/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#1E2A5A',
          800: '#2A3A70',
        },
        accent: {
          DEFAULT: '#2F6FED',
          hover: '#255ACC',
        },
        canvas: '#F5F6FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
