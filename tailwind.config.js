/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        shine: "shine var(--duration) infinite linear",
        "spin-slow": "spin 14s linear infinite",
        "spin-reverse-slow": "spin-reverse 14s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
        "spotlight": "spotlight 2s ease .75s 1 forwards",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        "meteor": "meteor 5s linear infinite",
        "scroll": "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
      },
      keyframes: {
        shine: {
          "0%": { "background-position": "0% 0%" },
          "50%": { "background-position": "100% 100%" },
          "to": { "background-position": "0% 0%" },
        },
        "spin-reverse": {
          "to": { transform: "rotate(-360deg)" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: 1 },
          "70%": { opacity: 1 },
          "100%": { transform: "rotate(215deg) translateX(-500px)", opacity: 0 },
        },
        scroll: {
          to: { transform: "translate(calc(-50% - 0.5rem))" },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        handwriting: ['Birthstone', 'cursive'],
      },
      colors: {
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
      },
    },
  },
  plugins: [],
}
