/**
 * Утилита для работы с темой Telegram WebApp
 * Документация: https://core.telegram.org/bots/webapps#themeparams
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
          header_bg_color?: string;
          accent_text_color?: string;
          section_bg_color?: string;
          section_header_text_color?: string;
          subtitle_text_color?: string;
          destructive_text_color?: string;
          bottom_bar_bg_color?: string;
          section_separator_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: any;
        MainButton: any;
        HapticFeedback: any;
        CloudStorage: any;
        BiometricManager: any;
        isVersionAtLeast: (version: string) => boolean;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        onEvent: (eventType: string, eventHandler: Function) => void;
        offEvent: (eventType: string, eventHandler: Function) => void;
        sendData: (data: string) => void;
        ready: () => void;
        expand: () => void;
        close: () => void;
        showPopup: (params: any) => void;
        showAlert: (message: string) => void;
        showConfirm: (message: string) => Promise<boolean>;
        showScanQrPopup: (params: any) => void;
        closeScanQrPopup: () => void;
        readTextFromClipboard: () => Promise<string>;
        requestWriteAccess: () => Promise<boolean>;
        requestContact: () => Promise<boolean>;
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
      };
    };
  }
}

// Флаг для отслеживания инициализации
let isInitialized = false;
let themeChangedHandler: (() => void) | null = null;

/**
 * Применяет цвета темы к CSS переменным
 */
function applyThemeColors(): void {
  if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
    return;
  }

  const webApp = window.Telegram.WebApp;
  const themeParams = webApp.themeParams;

  // Применяем цвета темы к CSS переменным
  if (themeParams.bg_color) {
    document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
  }
  if (themeParams.text_color) {
    document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
  }
  if (themeParams.hint_color) {
    document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
  }
  if (themeParams.link_color) {
    document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color);
  }
  if (themeParams.button_color) {
    document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color);
  }
  if (themeParams.button_text_color) {
    document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
  }
  if (themeParams.secondary_bg_color) {
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);
  }
  if (themeParams.header_bg_color) {
    document.documentElement.style.setProperty('--tg-theme-header-bg-color', themeParams.header_bg_color);
  }
  if (themeParams.accent_text_color) {
    document.documentElement.style.setProperty('--tg-theme-accent-text-color', themeParams.accent_text_color);
  }
  if (themeParams.section_bg_color) {
    document.documentElement.style.setProperty('--tg-theme-section-bg-color', themeParams.section_bg_color);
  }
  if (themeParams.section_header_text_color) {
    document.documentElement.style.setProperty('--tg-theme-section-header-text-color', themeParams.section_header_text_color);
  }
  if (themeParams.subtitle_text_color) {
    document.documentElement.style.setProperty('--tg-theme-subtitle-text-color', themeParams.subtitle_text_color);
  }
  if (themeParams.destructive_text_color) {
    document.documentElement.style.setProperty('--tg-theme-destructive-text-color', themeParams.destructive_text_color);
  }
  if (themeParams.bottom_bar_bg_color) {
    document.documentElement.style.setProperty('--tg-theme-bottom-bar-bg-color', themeParams.bottom_bar_bg_color);
  }
  if (themeParams.section_separator_color) {
    document.documentElement.style.setProperty('--tg-theme-section-separator-color', themeParams.section_separator_color);
  }
}

/**
 * Инициализирует тему Telegram и применяет CSS переменные
 * Вызывает ready() только один раз при первой инициализации
 */
export function initTelegramTheme(): void {
  if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
    console.warn('Telegram WebApp not available');
    return;
  }

  const webApp = window.Telegram.WebApp;

  // Применяем цвета темы
  applyThemeColors();

  // Инициализация выполняется только один раз
  if (!isInitialized) {
    // Уведомляем Telegram, что приложение готово (вызываем только один раз)
    webApp.ready();

    // Подписываемся на изменение темы (только один раз)
    themeChangedHandler = () => {
      applyThemeColors();
    };
    webApp.onEvent('themeChanged', themeChangedHandler);

    isInitialized = true;
  }
}

/**
 * Получает объект WebApp Telegram
 */
export function getTelegramWebApp() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
}

/**
 * Проверяет, запущено ли приложение в Telegram
 */
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

