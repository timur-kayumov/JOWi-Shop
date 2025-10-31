import { toast as sonnerToast } from 'sonner';

/**
 * Toast notification helpers with consistent styling
 * Uses sonner library for toast notifications
 */

export const toast = {
  /**
   * Show success toast notification
   */
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show error toast notification
   */
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  },

  /**
   * Show warning toast notification
   */
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show info toast notification
   */
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show loading toast notification
   * Returns toast ID that can be used to update or dismiss the toast
   */
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    });
  },

  /**
   * Show promise toast - automatically shows loading, success, or error based on promise state
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },

  /**
   * Custom toast with full control
   */
  custom: (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(message, options);
  },
};

/**
 * Example usage:
 *
 * // Success toast
 * toast.success('Товар добавлен', 'Coca-Cola 0.5л добавлена в чек');
 *
 * // Error toast
 * toast.error('Ошибка сохранения', 'Не удалось сохранить изменения');
 *
 * // Loading toast
 * const toastId = toast.loading('Сохранение...');
 * // Later:
 * toast.dismiss(toastId);
 * toast.success('Сохранено');
 *
 * // Promise toast
 * toast.promise(
 *   fetchData(),
 *   {
 *     loading: 'Загрузка данных...',
 *     success: 'Данные загружены',
 *     error: 'Ошибка загрузки'
 *   }
 * );
 */
