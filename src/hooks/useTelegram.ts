import { useEffect, useState, useCallback, useRef } from 'react';

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
  isMobile: boolean;
  theme: TelegramTheme;
  hapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  mainButton: {
    show: (text: string, onClick: () => void) => void;
    hide: () => void;
    setText: (text: string) => void;
  };
  ready: () => void;
  expand: () => void;
  requestMicrophoneAccess: () => Promise<MediaStream | null>;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        version: string;
        platform: string;
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
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
        };
        onEvent: (event: string, callback: () => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{ id?: string; type?: string; text?: string }>;
        }, callback?: (buttonId: string) => void) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        isVersionAtLeast: (version: string) => boolean;
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
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<TelegramTheme>(DEFAULT_THEME);
  const mainButtonCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg && tg.initData) {
      setIsTMA(true);
      // Check if running on mobile platform
      const platform = tg.platform;
      setIsMobile(platform === 'ios' || platform === 'android');

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

  const mainButton = {
    show: useCallback((text: string, onClick: () => void) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.MainButton) {
        // Remove previous callback if exists
        if (mainButtonCallbackRef.current) {
          tg.MainButton.offClick(mainButtonCallbackRef.current);
        }
        mainButtonCallbackRef.current = onClick;
        tg.MainButton.setText(text);
        tg.MainButton.onClick(onClick);
        tg.MainButton.show();
      }
    }, []),
    hide: useCallback(() => {
      const tg = window.Telegram?.WebApp;
      if (tg?.MainButton) {
        if (mainButtonCallbackRef.current) {
          tg.MainButton.offClick(mainButtonCallbackRef.current);
          mainButtonCallbackRef.current = null;
        }
        tg.MainButton.hide();
      }
    }, []),
    setText: useCallback((text: string) => {
      window.Telegram?.WebApp?.MainButton?.setText(text);
    }, []),
  };

  const requestMicrophoneAccess = useCallback(async (): Promise<MediaStream | null> => {
    // Request mic permission directly - Telegram/browser will show its own dialog
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      return stream;
    } catch {
      return null;
    }
  }, []);

  return {
    isTMA,
    isMobile,
    theme,
    hapticFeedback,
    mainButton,
    ready,
    expand,
    requestMicrophoneAccess,
  };
}
