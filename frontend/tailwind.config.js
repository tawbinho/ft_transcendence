/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        raised: 'var(--raised)',
        well: 'var(--well)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        disc1: 'var(--disc1)',
        disc2: 'var(--disc2)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'ui-rounded', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        clay: '24px',
        toy: '34px',
      },
      boxShadow: {
        clay: '8px 8px 18px var(--shadow-dark), -8px -8px 18px var(--shadow-light)',
        'clay-sm': '5px 5px 12px var(--shadow-dark), -5px -5px 12px var(--shadow-light)',
        'clay-in':
          'inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light)',
      },
    },
  },
  plugins: [],
};
