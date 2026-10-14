/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF1F7',
          100: '#D5DBE8',
          200: '#ABB7D1',
          300: '#8193BA',
          400: '#576FA3',
          500: '#1F3864',
          600: '#192D53',
          700: '#132242',
          800: '#0E1831',
          900: '#070C19',
        },
        accent: '#254277',
        background: '#F2F4F8',
        surface: '#FFFFFF',
        'text-body': '#3B3F45',
        'text-muted': '#8A8F98',
      },
      fontSize: {
        heading: '22px',
        subheading: '16px',
        body: '14px',
        caption: '12px',
      },
      borderRadius: {
        card: '12px',
        chip: '9999px',
      },
    },
  },
  plugins: [],
}

