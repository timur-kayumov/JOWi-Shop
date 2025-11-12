/**
 * i18next configuration
 */

export const i18nConfig = {
  defaultLocale: 'ru' as const,
  supportedLocales: ['ru', 'uz'] as const,
  namespaces: ['common', 'auth', 'pos', 'inventory', 'finance', 'errors'] as const,
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
  dateFormat: 'DD.MM.YYYY',
  timeFormat: 'HH:mm',
  dateTimeFormat: 'DD.MM.YYYY HH:mm',
};

export type Locale = (typeof i18nConfig.supportedLocales)[number];
export type Namespace = (typeof i18nConfig.namespaces)[number];
