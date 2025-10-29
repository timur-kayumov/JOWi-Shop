'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure i18n is initialized on client side
    if (typeof window !== 'undefined') {
      // Load saved language from localStorage on mount
      const savedLanguage = localStorage.getItem('jowi-language');
      if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'uz')) {
        i18n.changeLanguage(savedLanguage).then(() => setIsReady(true));
      } else {
        setIsReady(true);
      }
    }
  }, []);

  // Render immediately to avoid hydration mismatch
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
