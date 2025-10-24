# Changelog

Все значимые изменения в проекте JOWi Shop будут документироваться в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
и этот проект следует [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Development

### Added
- Базовая структура монорепозитория (Turborepo)
- Next.js приложение для web admin панели
- Страница регистрации с 3-шаговым процессом:
  - Шаг 1: Ввод телефона и имени с согласием на условия
  - Шаг 2: Подтверждение через OTP код
  - Шаг 3: Информация о бизнесе (тип и название)
- Страница входа (login)
- **Интранет (внутренние страницы):**
  - AppShell layout с боковой навигацией и header
  - 4 страницы: Магазины, Сотрудники, Клиенты, Отчёты
  - URL-based активная навигация
  - Breadcrumbs (хлебные крошки)
  - Глобальный поиск (заготовка)
- UI компоненты из @jowi/ui:
  - **Layout:** AppShell, Sidebar, SidebarNav, TopBar
  - **Navigation:** Breadcrumbs, SearchBar
  - **User:** Avatar, UserMenu, NotificationBadge, ThemeToggle
  - **Primitives:** DropdownMenu (Radix UI)
  - **Forms:** PhoneInput, OTPInput, StepIndicator, BusinessTypeCard, Button, Input, Card
- **Темная тема:**
  - next-themes для управления темой
  - ThemeProvider с localStorage persistence
  - CSS переменные для light/dark режимов
  - Переключатель темы в header
- Валидация форм через React Hook Form + Zod
- Zod схемы валидации в @jowi/validators:
  - registerStep1Schema (телефон, имя, согласие)
  - registerStep2Schema (OTP)
  - registerStep3Schema (тип бизнеса, название)
- CLAUDE.md с полной документацией проекта и инструкциями для разработки
- DEPLOYMENT.md с roadmap подготовки к production

### Changed
- 2025-10-24: Главная страница (/) теперь автоматически редиректит на /register вместо показа выбора между регистрацией и входом
- 2025-10-24: Страница успешной регистрации теперь редиректит на /intranet/stores вместо /dashboard

### Technical Decisions
- Использование Next.js 15.5.6 с App Router
- Tailwind CSS для стилизации
- TypeScript для type safety
- Монорепозиторий для shared packages

### Developer Notes
- Dev server запускается на порту 3000 (http://localhost:3000)
- Используется pnpm для управления зависимостями
- Проект находится в начальной стадии разработки (MVP)

---

## Version History Template

Когда начнем релизить версии, формат будет такой:

## [1.0.0] - YYYY-MM-DD

### Added
- Новая функциональность

### Changed
- Изменения в существующей функциональности

### Deprecated
- Функциональность, которая скоро будет удалена

### Removed
- Удаленная функциональность

### Fixed
- Исправленные баги

### Security
- Исправления безопасности

---

## Development Log

### 2025-10-24

**Session 1: Initial Setup & Registration Flow**
- Создана базовая структура регистрации
- Настроен редирект с главной страницы на регистрацию
- Добавлены UI компоненты для форм
- Созданы Zod схемы валидации
- Документация: CLAUDE.md, DEPLOYMENT.md, CHANGELOG.md
- Status: ✅ Registration UI complete (backend API integration pending)

**Session 2: Intranet Navigation System**
- ✅ Создана полная навигационная система для интранета
- ✅ Реализованы 10 новых UI компонентов в @jowi/ui
- ✅ AppShell layout с адаптивной боковой навигацией:
  - Desktop: сворачиваемый sidebar (256px → 64px)
  - Mobile: гамбургер меню с overlay
- ✅ TopBar с breadcrumbs, поиском, уведомлениями, темой, аватаркой
- ✅ Темная тема (next-themes) с плавным переключением
- ✅ 4 страницы интранета с заглушками контента
- ✅ URL-based активная навигация с иконками (lucide-react)
- ✅ User menu dropdown (Профиль, Настройки, Выход)
- Status: ✅ Navigation system fully functional and tested

**Tested Features:**
- ✅ Переключение между страницами (Магазины, Сотрудники, Клиенты, Отчёты)
- ✅ Breadcrumbs автоматически обновляются при навигации
- ✅ Темная/светлая тема переключается корректно
- ✅ Sidebar сворачивается в режим иконок
- ✅ User menu dropdown открывается с опциями
- ✅ Адаптивность (desktop 1440px и mobile)

**Next Steps:**
- Настройка PostgreSQL + Prisma
- Реализация backend API для регистрации
- Интеграция SMS provider для OTP
- Реализация аутентификации
- Добавить содержимое страниц интранета

---

## Future Milestones

### MVP v0.1.0 (Target: TBD)
- [ ] User authentication (JWT + 2FA)
- [ ] Multi-tenant database с RLS
- [ ] Базовое управление бизнесом/магазинами
- [ ] POS desktop app (Electron)
- [ ] Управление товарами
- [ ] Оформление продаж
- [ ] Базовые отчеты
- [ ] Offline-first sync для POS

### Beta v0.5.0 (Target: TBD)
- [ ] Fiscal integration (abstract layer)
- [ ] Inventory management
- [ ] Employee & shifts management
- [ ] Financial reports
- [ ] i18n (RU/UZ)

### Production v1.0.0 (Target: TBD)
- [ ] Full fiscalization compliance
- [ ] Product marking integration (AslBelgisi)
- [ ] JOWi Club loyalty integration
- [ ] Production infrastructure
- [ ] Monitoring & alerts
- [ ] User documentation
- [ ] Support system

---

**Note:** Этот changelog будет обновляться после каждой значимой сессии разработки.
