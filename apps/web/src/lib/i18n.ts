import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations from @jowi/i18n package
import ruCommon from '@jowi/i18n/src/locales/ru/common.json';
import uzCommon from '@jowi/i18n/src/locales/uz/common.json';

const resources = {
  ru: {
    common: ruCommon,
  },
  uz: {
    common: uzCommon,
  },
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru', // default language
    fallbackLng: 'ru',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for Next.js
    },
  });

export default i18n;
