import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/contexts';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeScript } from './theme-script';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'Queue Star - Blend Your Music Taste With Friends',
  description: 'Create perfectly mixed playlists that combine your favorite tracks with your friends\' top songs',
  keywords: ['music', 'playlist', 'spotify', 'apple music', 'friends', 'blend'],
  authors: [{ name: 'Queue Star Team' }],
  openGraph: {
    title: 'Queue Star - Blend Your Music Taste With Friends',
    description: 'Create perfectly mixed playlists that combine your favorite tracks with your friends\' top songs',
    type: 'website',
    siteName: 'Queue Star',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Queue Star - Blend Your Music Taste With Friends',
    description: 'Create perfectly mixed playlists that combine your favorite tracks with your friends\' top songs',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <AppProviders>
            {children}
            <Toaster />
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}