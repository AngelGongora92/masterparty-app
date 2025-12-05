/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Esta línea es la clave
  ],
  theme: {
    extend: {
      textShadow: {
        // Sombra blanca estática para un efecto de "glow"
        'custom': '0 0 8px rgba(255, 255, 255, 0.4)',
      },
      keyframes: {
        'pulse-shadow': {
          '0%, 100%': { textShadow: '0 0 8px rgba(255, 255, 255, 0.4)' },
          '50%': { textShadow: '0 0 16px rgba(255, 255, 255, 0.8)' },
        },
      },
      animation: {
        'pulse-shadow': 'pulse-shadow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  // Necesitamos un plugin para que Tailwind entienda 'textShadow'
  plugins: [require('tailwindcss-textshadow')],
}