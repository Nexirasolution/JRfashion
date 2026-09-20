/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      animation: {
        marquee: 'marquee 22s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      // Black / white / gold theme. The original key names are kept so any
      // existing `bg-brand-*` / `text-brand-*` classes keep working and pick
      // up the new palette automatically.
      colors: {
        brand: {
          pink: '#C9A227',       // was bright red — now gold accent
          magenta: '#000000',    // was maroon — primary brand color (wordmark, CTAs, prices) is now black
          rose: '#333333',       // was lighter maroon — hover/secondary tone is now dark grey
          green: '#4A4A4A',      // was light green — now neutral grey
          deepgreen: '#1A1A1A',  // was forest green — now near-black
          gold: '#C9A227',       // gold accent (matches the gold used on the redesigned pages)
          cream: '#FAFAFA',      // was warm off-white — now a neutral off-white background
          ink: '#000000',        // text color

          // New helpers that match the constants used on the redesigned pages
          goldwash: '#F6EFD9',   // pale gold tint for hovers and placeholders
          inksoft: '#6B6B6B',    // secondary text
          line: '#E8E8E8'        // hairline borders
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)']
      },
      boxShadow: {
        soft: '0 8px 30px -8px rgba(0,0,0,0.12)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
};