import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '../providers/theme-provider';
import { I18nProvider } from '../providers/i18n-provider';
import { CustomToaster } from '../components/custom-toaster';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'JOWi Shop - Admin Panel',
  description: 'Multi-tenant retail management system',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read language from headers (set by middleware from cookie)
  const headersList = await headers();
  const language = headersList.get('x-jowi-language') || 'ru';

  return (
    <html lang={language} suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider initialLanguage={language}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <CustomToaster />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
