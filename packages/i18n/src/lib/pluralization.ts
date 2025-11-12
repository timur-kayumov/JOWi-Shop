/**
 * Pluralization helpers for Russian and Uzbek languages
 * Handles proper word endings based on count
 */

/**
 * Russian pluralization rules
 * @param count - The number to pluralize for
 * @param forms - Array of word forms [one, few, many]
 *   - forms[0]: singular (1 товар)
 *   - forms[1]: few (2-4 товара)
 *   - forms[2]: many (5+ товаров)
 * @returns The correct form based on count
 *
 * Examples:
 * - pluralizeRu(1, ['товар', 'товара', 'товаров']) => '1 товар'
 * - pluralizeRu(2, ['товар', 'товара', 'товаров']) => '2 товара'
 * - pluralizeRu(5, ['товар', 'товара', 'товаров']) => '5 товаров'
 * - pluralizeRu(21, ['товар', 'товара', 'товаров']) => '21 товар'
 */
export function pluralizeRu(count: number, forms: [string, string, string]): string {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;

  let form: string;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    // 11-19: many form (товаров)
    form = forms[2];
  } else if (lastDigit === 1) {
    // 1, 21, 31, etc: singular form (товар)
    form = forms[0];
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    // 2-4, 22-24, 32-34, etc: few form (товара)
    form = forms[1];
  } else {
    // 0, 5-9, 10, 20, 25-30, etc: many form (товаров)
    form = forms[2];
  }

  return `${count} ${form}`;
}

/**
 * Uzbek pluralization rules
 * Uzbek language doesn't typically change word endings based on count
 * But we use "ta" suffix for counting
 *
 * @param count - The number to pluralize for
 * @param forms - Array of word forms [singular, with_ta_suffix]
 *   - forms[0]: base word (mahsulot)
 *   - forms[1]: word with "ta" (mahsulot - stays the same)
 * @returns The correct form based on count
 *
 * Examples:
 * - pluralizeUz(1, ['mahsulot', 'mahsulot']) => '1 ta mahsulot'
 * - pluralizeUz(5, ['mahsulot', 'mahsulot']) => '5 ta mahsulot'
 */
export function pluralizeUz(count: number, forms: [string, string]): string {
  // In Uzbek, we use "ta" as a counting suffix
  // The word itself doesn't change
  return `${count} ta ${forms[1] || forms[0]}`;
}

/**
 * Common product pluralization forms
 */
export const productFormsRu: [string, string, string] = ['товар', 'товара', 'товаров'];
export const productFormsUz: [string, string] = ['mahsulot', 'mahsulot'];

/**
 * Helper to get pluralized product count based on locale
 * @param count - Number of products
 * @param locale - Current locale ('ru' or 'uz')
 * @returns Formatted string with count and correct pluralization
 */
export function pluralizeProducts(count: number, locale: 'ru' | 'uz'): string {
  if (locale === 'uz') {
    return pluralizeUz(count, productFormsUz);
  }
  return pluralizeRu(count, productFormsRu);
}
