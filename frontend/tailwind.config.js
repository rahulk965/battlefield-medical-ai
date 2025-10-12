/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        military: {
          dark: '#1a202c',
          medium: '#2d3748',
          light: '#4a5568',
          accent: '#e53e3e',
          success: '#38a169',
          warning: '#d69e2e',
          emergency: '#e53e3e'
        }
      },
      animation: {
        'pulse-emergency': 'pulse 1s ease-in-out infinite',
        'blink': 'blink 1s step-start infinite'
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0.3' }
        }
      }
    },
  },
  plugins: [],
}