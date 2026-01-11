/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        telegram: {
          // Основные цвета темы Telegram
          bg: 'var(--tg-theme-bg-color, #ffffff)',
          'bg-secondary': 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
          text: 'var(--tg-theme-text-color, #000000)',
          hint: 'var(--tg-theme-hint-color, #999999)',
          link: 'var(--tg-theme-link-color, #2481cc)',
          button: 'var(--tg-theme-button-color, #2481cc)',
          'button-text': 'var(--tg-theme-button-text-color, #ffffff)',
          header: 'var(--tg-theme-button-color, #2481cc)',
          'accent-text': 'var(--tg-theme-accent-text-color, #2481cc)',
          section: 'var(--tg-theme-section-bg-color, #ffffff)',
          'section-header': 'var(--tg-theme-section-header-text-color, #2481cc)',
          subtitle: 'var(--tg-theme-subtitle-text-color, #999999)',
          destructive: 'var(--tg-theme-destructive-text-color, #ff3b30)',
          'bottom-bar': 'var(--tg-theme-bottom-bar-bg-color, #ffffff)',
          'section-separator': 'var(--tg-theme-section-separator-color, #e5e5e5)',
        },
      },
    },
  },
  plugins: [],
}

