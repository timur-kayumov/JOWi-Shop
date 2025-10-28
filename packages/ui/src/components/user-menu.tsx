'use client';

import * as React from 'react';
import { LogOut, Settings, User, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './dropdown-menu';

export type Language = 'ru' | 'uz';

export interface UserMenuProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
  };
  currentLanguage?: Language;
  onLanguageChange?: (language: Language) => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
}

export function UserMenu({
  user,
  currentLanguage = 'ru',
  onLanguageChange,
  onSettingsClick,
  onProfileClick,
  onLogoutClick,
}: UserMenuProps) {
  const { t } = useTranslation('common');

  const languageLabels: Record<Language, string> = {
    ru: 'Русский',
    uz: "O'zbekcha",
  };

  const languageFlags: Record<Language, string> = {
    ru: '🇷🇺',
    uz: '🇺🇿',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <Avatar src={user.avatar} alt={user.name} fallback={user.name} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{user.name}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onProfileClick && (
          <DropdownMenuItem onClick={onProfileClick}>
            <User className="mr-2 h-4 w-4" />
            {t('user.profile')}
          </DropdownMenuItem>
        )}
        {onSettingsClick && (
          <DropdownMenuItem onClick={onSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            {t('navigation.settings')}
          </DropdownMenuItem>
        )}
        {onLanguageChange && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages className="mr-2 h-4 w-4" />
              <span>{t('user.language')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => onLanguageChange('ru')}
                className={currentLanguage === 'ru' ? 'bg-accent' : ''}
              >
                <span className="mr-2">{languageFlags.ru}</span>
                {languageLabels.ru}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onLanguageChange('uz')}
                className={currentLanguage === 'uz' ? 'bg-accent' : ''}
              >
                <span className="mr-2">{languageFlags.uz}</span>
                {languageLabels.uz}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />
        {onLogoutClick && (
          <DropdownMenuItem onClick={onLogoutClick}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('user.logout')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
