// src/app/layout.tsx
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NOTIFICATION_SETTINGS } from '@/config/constants';

// Import global styles
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

interface RootLayoutProps {
  children: ReactNode;
}

export const metadata = {
  title: 'DevFolio',
  description: 'Showcase your projects and certificates',
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider
              maxStoredNotifications={NOTIFICATION_SETTINGS.maxStored}
            >
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: NOTIFICATION_SETTINGS.defaultDuration,
                  error: {
                    duration: NOTIFICATION_SETTINGS.errorDuration,
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
