'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load saved language from localStorage on mount
    const savedLanguage = localStorage.getItem('jowi-language');
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'uz')) {
      i18n.changeLanguage(savedLanguage);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
