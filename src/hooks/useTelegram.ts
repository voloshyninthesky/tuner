import { useEffect, useState, useCallback } from 'react';

interface TelegramTheme {
  bgColor: string;
  textColor: string;
  hintColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
}

interface UseTelegramReturn {
  isTMA: boolean;
  theme: TelegramTheme;
  hapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        HapticFeedback: {
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
          selectionChanged: () => void;
        };
        onEvent: (event: string, callback: () => void) => void;
      };
    };
  }
}

const DEFAULT_THEME: TelegramTheme = {
  bgColor: '#1a1a2e',
  textColor: '#ffffff',
  hintColor: '#8b8b9e',
  buttonColor: '#4f46e5',
  buttonTextColor: '#ffffff',
  secondaryBgColor: '#16213e',
};

export function useTelegram(): UseTelegramReturn {
  const [isTMA, setIsTMA] = useState(false);
  const [theme, setTheme] = useState<TelegramTheme>(DEFAULT_THEME);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg && tg.initData) {
      setIsTMA(true);

      // Get theme from Telegram
      const themeParams = tg.themeParams;
      setTheme({
        bgColor: themeParams.bg_color || DEFAULT_THEME.bgColor,
        textColor: themeParams.text_color || DEFAULT_THEME.textColor,
        hintColor: themeParams.hint_color || DEFAULT_THEME.hintColor,
        buttonColor: themeParams.button_color || DEFAULT_THEME.buttonColor,
        buttonTextColor: themeParams.button_text_color || DEFAULT_THEME.buttonTextColor,
        secondaryBgColor: themeParams.secondary_bg_color || DEFAULT_THEME.secondaryBgColor,
      });

      // Apply theme to CSS variables
      const root = document.documentElement;
      root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || DEFAULT_THEME.bgColor);
      root.style.setProperty('--tg-theme-text-color', themeParams.text_color || DEFAULT_THEME.textColor);
      root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || DEFAULT_THEME.hintColor);
      root.style.setProperty('--tg-theme-button-color', themeParams.button_color || DEFAULT_THEME.buttonColor);
      root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || DEFAULT_THEME.buttonTextColor);
      root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || DEFAULT_THEME.secondaryBgColor);

      // Listen for theme changes
      tg.onEvent('themeChanged', () => {
        const newTheme = tg.themeParams;
        setTheme({
          bgColor: newTheme.bg_color || DEFAULT_THEME.bgColor,
          textColor: newTheme.text_color || DEFAULT_THEME.textColor,
          hintColor: newTheme.hint_color || DEFAULT_THEME.hintColor,
          buttonColor: newTheme.button_color || DEFAULT_THEME.buttonColor,
          buttonTextColor: newTheme.button_text_color || DEFAULT_THEME.buttonTextColor,
          secondaryBgColor: newTheme.secondary_bg_color || DEFAULT_THEME.secondaryBgColor,
        });
      });

      // Signal that app is ready
      tg.ready();
      tg.expand();
    }
  }, []);

  const hapticFeedback = {
    impactOccurred: useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    }, []),
    notificationOccurred: useCallback((type: 'error' | 'success' | 'warning') => {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
    }, []),
    selectionChanged: useCallback(() => {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    }, []),
  };

  const ready = useCallback(() => {
    window.Telegram?.WebApp?.ready();
  }, []);

  const expand = useCallback(() => {
    window.Telegram?.WebApp?.expand();
  }, []);

  return {
    isTMA,
    theme,
    hapticFeedback,
    ready,
    expand,
  };
}
