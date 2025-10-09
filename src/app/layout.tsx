import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LoadingProvider } from '@/components/ui/LoadingProvider';
import { SettingsProvider } from '@/contexts/SettingsContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aquarium WebAR Experience',
  description:
    'Immersive augmented reality experience bringing sea creatures to life. Scan QR codes to interact with marine life in your own space.',
  keywords: [
    'aquarium',
    'AR',
    'augmented reality',
    'sea creatures',
    'marine life',
    'interactive',
    'WebAR',
  ],
  authors: [{ name: 'Aquarium' }],
  viewport: 'width=device-width, initial-scale=1, user-scalable=no',
  themeColor: '#1e40af',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Aquarium WebAR Experience',
    description: 'Immersive augmented reality experience with sea creatures',
    type: 'website',
    siteName: 'Aquarium',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div id="skip-link" className="sr-only">
          <a
            href="#main-content"
            className="absolute top-0 left-0 bg-blue-600 text-white p-2 -translate-y-full focus:translate-y-0 transition-transform"
          >
            Skip to main content
          </a>
        </div>
        <SettingsProvider>
          <LoadingProvider>
            <main id="main-content">{children}</main>
          </LoadingProvider>
        </SettingsProvider>
        <div id="aria-live-region" aria-live="polite" className="sr-only"></div>
      </body>
    </html>
  );
}
