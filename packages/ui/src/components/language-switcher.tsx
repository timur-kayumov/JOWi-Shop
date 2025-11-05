'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { cn } from '../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface LanguageSwitcherProps {
  className?: string;
}

const languages = [
  {
    code: 'ru',
    name: 'Русский',
    flag: '/images/flags/russia.svg',
  },
  {
    code: 'uz',
    name: "O'zbekcha",
    flag: '/images/flags/uzbekistan.svg',
  },
];

export const LanguageSwitcher = React.forwardRef<HTMLDivElement, LanguageSwitcherProps>(
  ({ className }, ref) => {
    const { i18n } = useTranslation();
    const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

    const handleLanguageChange = (languageCode: string) => {
      i18n.changeLanguage(languageCode);
      // Save to cookie (accessible on both server and client)
      Cookies.set('jowi-language', languageCode, { expires: 365 });
      // Also update localStorage to keep them in sync
      if (typeof window !== 'undefined') {
        localStorage.setItem('jowi-language', languageCode);
      }
      // Force page reload to ensure server and client are in sync
      window.location.reload();
    };

    return (
      <div ref={ref} className={cn('', className)}>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
            <Image
              src={currentLanguage.flag}
              alt={currentLanguage.name}
              width={20}
              height={20}
              className="rounded-sm"
            />
            <span className="hidden sm:inline">{currentLanguage.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className="flex items-center gap-2"
              >
                <Image
                  src={language.flag}
                  alt={language.name}
                  width={20}
                  height={20}
                  className="rounded-sm"
                />
                <span>{language.name}</span>
                {language.code === i18n.language && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

LanguageSwitcher.displayName = 'LanguageSwitcher';
