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
  theme: TelegramTheme;
  hapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  requestMicrophoneAccess: () => Promise<boolean>;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        version: string;
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
  const [theme, setTheme] = useState<TelegramTheme>(DEFAULT_THEME);
  const micPermissionGranted = useRef(false);

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

  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    // Already granted in this session
    if (micPermissionGranted.current) {
      return true;
    }

    const tg = window.Telegram?.WebApp;

    // If running in Telegram, show a popup first to explain why we need mic access
    if (tg && tg.initData && tg.showPopup) {
      return new Promise((resolve) => {
        tg.showPopup(
          {
            title: 'Microphone Access',
            message: 'This tuner needs microphone access to detect the pitch of your instrument. Please allow microphone access when prompted.',
            buttons: [
              { id: 'allow', type: 'default', text: 'Continue' },
              { id: 'cancel', type: 'cancel', text: 'Cancel' },
            ],
          },
          async (buttonId) => {
            if (buttonId === 'allow') {
              try {
                // Request actual browser mic permission
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Stop the stream immediately, we just needed permission
                stream.getTracks().forEach(track => track.stop());
                micPermissionGranted.current = true;
                resolve(true);
              } catch {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          }
        );
      });
    }

    // Not in Telegram or popup not available, try direct permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      micPermissionGranted.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    isTMA,
    theme,
    hapticFeedback,
    ready,
    expand,
    requestMicrophoneAccess,
  };
}
