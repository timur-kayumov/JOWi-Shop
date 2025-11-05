'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: string;
}

export function I18nProvider({ children, initialLanguage = 'ru' }: I18nProviderProps) {
  // Set language synchronously before render to avoid hydration mismatch
  if (i18n.language !== initialLanguage) {
    i18n.changeLanguage(initialLanguage);
  }

  // Sync localStorage with the server-provided language after hydration
  useEffect(() => {
    // Update localStorage to match the server's language from cookie
    if (typeof window !== 'undefined') {
      const currentLocalStorageLanguage = localStorage.getItem('jowi-language');
      if (currentLocalStorageLanguage !== initialLanguage) {
        localStorage.setItem('jowi-language', initialLanguage);
      }
    }
  }, [initialLanguage]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
