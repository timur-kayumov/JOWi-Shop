import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations from @jowi/i18n package
import ruCommon from '@jowi/i18n/src/locales/ru/common.json';
import uzCommon from '@jowi/i18n/src/locales/uz/common.json';
import ruAuth from '@jowi/i18n/src/locales/ru/auth.json';
import uzAuth from '@jowi/i18n/src/locales/uz/auth.json';

const resources = {
  ru: {
    common: ruCommon,
    auth: ruAuth,
  },
  uz: {
    common: uzCommon,
    auth: uzAuth,
  },
};

// Get initial language from cookie (client-side) or use fallback
const getInitialLanguage = (): string => {
  if (typeof window === 'undefined') {
    // On server, default to 'ru' - will be overridden by I18nProvider with server value
    return 'ru';
  }

  // On client, read from cookie to match server-side value
  const cookieLanguage = document.cookie
    .split('; ')
    .find(row => row.startsWith('jowi-language='))
    ?.split('=')[1];

  return cookieLanguage || 'ru';
};

// Initialize i18next only if not already initialized
if (!i18n.isInitialized) {
  const initialLanguage = getInitialLanguage();

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage, // Use language from cookie to match server
      fallbackLng: 'ru',
      defaultNS: 'common',
      ns: ['common', 'auth'],
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false, // Disable suspense for Next.js
      },
    });
}

export default i18n;
