/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        believe: '#FF6B00',
        skeptic: '#00D4FF',
        obsidian: '#0A0A0A',
        navy: '#1A1A2E'
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'surge': 'surge 2.5s ease-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        surge: {
          '0%': { transform: 'scaleX(0)', opacity: '0.8' },
          '100%': { transform: 'scaleX(1.5)', opacity: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 15px rgba(255, 107, 0, 0.5)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 35px rgba(255, 107, 0, 0.9)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
