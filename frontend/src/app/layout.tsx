// frontend/src/app/layout.tsx
'use client';

import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import '@/styles/globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--background-color)',
                    color: 'var(--text-color)',
                    border: '1px solid var(--border-color)',
                  },
                }}
              />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}