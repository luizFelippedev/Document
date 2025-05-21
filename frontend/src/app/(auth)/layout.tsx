// frontend/src/app/(auth)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(ROUTES.DASHBOARD.ROOT);
    }
  }, [isAuthenticated, loading, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
        <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent animate-spin"></div>
      </div>
    );
  }
  
  // Content variants for animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Page variants for staggered animations
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.5
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4 bg-pattern"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Background animated elements */}
        {!isMobile && (
          <>
            <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            
            {/* Floating shapes */}
            <motion.div
              className="absolute top-[15%] left-[15%] w-8 h-8 rounded bg-blue-400/20 dark:bg-blue-400/10"
              animate={{
                y: [0, 15, 0],
                rotate: [0, 5, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-[20%] right-[18%] w-12 h-12 rounded-full bg-indigo-400/20 dark:bg-indigo-400/10"
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-[30%] right-[25%] w-6 h-6 rotate-45 bg-purple-400/20 dark:bg-purple-400/10"
              animate={{
                y: [0, 10, 0],
                rotate: [45, 65, 45]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        )}
        
        {/* Main content */}
        <motion.div variants={pageVariants} className="z-10">
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}