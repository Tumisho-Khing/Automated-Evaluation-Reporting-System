/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'nti-navy': '#1E3A6D',
        'nti-navy-light': '#2A4F8A',
        'nti-navy-dark': '#15294F',
        'success-green': '#16A34A',
        'success-green-light': '#22C55E',
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
