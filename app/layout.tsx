import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { ReduxProvider } from '@/store/provider';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthInitializer } from '@/components/auth-initializer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CV Maker — Free Professional CV Builder',
  description: 'Create a professional CV in minutes — free forever. ATS-optimized with instant PDF, DOCX, and high-DPI export.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 transition-colors duration-150">
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
            <AuthInitializer />
            {children}
            <Toaster position="top-right" richColors closeButton expand={false} />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
