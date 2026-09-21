/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2', // Primary warm cream background from screenshot
          200: '#F4ECE1',
          300: '#EAE0D0',
        },
        brand: {
          orange: '#FF6B4A', // Vibrant primary coral/orange accent
          coral: '#FF8A65',
          dark: '#E0533C',
          peach: '#FFF2ED',
          light: '#FFF9F6',
        },
        charcoal: {
          DEFAULT: '#2D2825',
          light: '#4A433E',
          muted: '#786F6A',
        },
        warm: {
          border: '#EFE8E1',
          card: '#FFFFFF',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(224, 83, 60, 0.05), 0 1px 4px -1px rgba(45, 40, 37, 0.03)',
        'soft-md': '0 8px 24px -4px rgba(224, 83, 60, 0.08), 0 2px 8px -2px rgba(45, 40, 37, 0.04)',
        'soft-lg': '0 16px 32px -6px rgba(224, 83, 60, 0.12), 0 4px 12px -2px rgba(45, 40, 37, 0.05)',
      }
    },
  },
  plugins: [],
};
