/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Signature palette: ink navy + warm signal-orange accent (hall-pass orange),
        // distinct from the generic warm-cream/terracotta AI defaults.
        ink: {
          950: '#0B0F19',
          900: '#111726',
          800: '#1A2233',
          700: '#232D42',
          600: '#333F5C'
        },
        paper: {
          50: '#FAFBFD',
          100: '#F1F4F9',
          200: '#E4E9F1'
        },
        signal: {
          400: '#FF8A4C',
          500: '#FF6B2C',
          600: '#E85A1C'
        },
        mint: {
          400: '#3DD9A8',
          500: '#22C08C'
        },
        danger: {
          400: '#FF6470',
          500: '#EF4452'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '18px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,15,25,0.04), 0 8px 24px -12px rgba(11,15,25,0.12)',
        cardDark: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.5)'
      }
    }
  },
  plugins: []
};
