/**
 * @jowi/ui - Shared UI component library
 * Built with Tailwind CSS + Radix UI primitives
 */

export * from './lib/utils';
export * from './lib/format-date';

// Form components
export * from './components/button';
export * from './components/card';
export * from './components/input';
export * from './components/phone-input';
export * from './components/otp-input';
export * from './components/time-input';
export * from './components/label';
export * from './components/textarea';
export * from './components/select';
export * from './components/form';
export * from './components/image-upload';

// Layout components
export * from './components/app-shell';
export * from './components/sidebar';
export * from './components/sidebar-nav';
export * from './components/topbar';
export * from './components/pos-download-banner';
export * from './components/auth-layout';
export * from './components/language-switcher';

// Navigation components
export * from './components/breadcrumbs';
export * from './components/search-bar';
export * from './components/global-search';

// User components
export * from './components/avatar';
export * from './components/user-menu';
export type { Language } from './components/user-menu';
export * from './components/notification-badge';
export * from './components/notification-panel';
export type { Notification } from './components/notification-panel';
export * from './components/theme-toggle';

// Primitives
export * from './components/dropdown-menu';
export * from './components/dialog';
export * from './components/popover';
export * from './components/badge';
export * from './components/status-badge';
export * from './lib/status-config';
export * from './components/tabs';
export * from './components/data-table';
export * from './components/loader';
export * from './components/calendar';
export * from './components/date-picker';
export * from './components/checkbox';
export * from './components/switch';
export * from './components/tooltip';

// Registration components
export * from './components/step-indicator';
export * from './components/business-type-card';

// Shared components (reusable across detail pages)
export * from './components/comments';
export * from './components/activity-history';
export type { Comment, CommentsProps } from './components/comments';
export type { Activity, ActivityType, FieldChange, ActivityHistoryProps } from './components/activity-history';
