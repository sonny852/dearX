/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: '#ff8c69',
        'coral-dark': '#ff6b47',
        gold: '#ffc17a',
        cream: '#f5e6d3',
        dark: '#1a1612',
        'dark-card': 'rgba(40, 35, 30, 0.6)',
        brown: '#a0826d',
        'brown-dark': '#8b6945',
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 1.2s ease-out forwards',
        'float': 'float 2s ease-in-out infinite',
        'pulse-dot': 'pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
