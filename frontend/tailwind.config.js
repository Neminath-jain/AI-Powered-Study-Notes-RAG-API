/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F19',     // Rich deep canvas
          card: '#151D30',   // Apple surface tile
          border: '#222F4C', // Soft hairline border
          text: '#F5F5F7'    // Parchment white body text
        },
        brand: {
          primary: '#0066cc', // Apple Action Blue
          hover: '#0071e3',   // Apple Focus Blue
          sky: '#2997ff',     // Apple Sky Link Blue
          glow: 'rgba(0, 102, 204, 0.2)'
        }
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', 'Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      letterSpacing: {
        apple: '-0.374px',
        tightest: '-0.28px'
      }
    },
  },
  plugins: [],
}
