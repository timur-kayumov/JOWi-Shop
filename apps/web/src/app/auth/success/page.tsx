'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@jowi/ui';

export default function AuthSuccessPage() {
  const { t } = useTranslation('common');

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t('pages.authSuccess.title')}
        </h1>
        <p className="mb-4 text-muted-foreground">{t('pages.authSuccess.subtitle')}</p>

        {/* Message */}
        <div className="mb-8 rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            {t('pages.authSuccess.message')}
          </p>
        </div>

        {/* User Info (Mock) */}
        <div className="mb-6 space-y-2 text-left">
          <div className="flex justify-between rounded-md bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">{t('pages.authSuccess.userInfo.phone')}</span>
            <span className="text-sm font-medium">+998 90 123-45-67</span>
          </div>
          <div className="flex justify-between rounded-md bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">{t('pages.authSuccess.userInfo.name')}</span>
            <span className="text-sm font-medium">{t('pages.authSuccess.userInfo.testUser')}</span>
          </div>
          <div className="flex justify-between rounded-md bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">{t('pages.authSuccess.userInfo.business')}</span>
            <span className="text-sm font-medium">{t('pages.authSuccess.userInfo.testBusiness')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/intranet/stores">{t('pages.authSuccess.goToIntranet')}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{t('pages.authSuccess.loginAgain')}</Link>
          </Button>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-xs text-muted-foreground">
          <p>
            <strong>{t('pages.authSuccess.note')}</strong> {t('pages.authSuccess.noteText')}
          </p>
        </div>
      </Card>
    </div>
  );
}
