// frontend/src/app/(auth)/verify-email/[token]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROUTES } from '@/config/routes';
import { APP_NAME } from '@/config/constants';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { Spinner } from '@/components/ui/Spinner';
import { authService } from '@/services/auth.service';
import { motion } from 'framer-motion';

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await authService.verifyEmail(params.token);
        setIsSuccess(true);
        // Redirect to login after 5 seconds
        setTimeout(() => {
          router.push(ROUTES.AUTH.LOGIN);
        }, 5000);
      } catch (err: any) {
        setError(
          err.response?.data?.message || 
          "Email verification failed. This link may be invalid or expired."
        );
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyEmail();
  }, [params.token, router]);
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card>
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <AnimatedLogo className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{APP_NAME}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Email Verification
            </p>
          </div>
          
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center"
          >
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="large" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Verifying your email address...
                </p>
              </div>
            ) : isSuccess ? (
              <div>
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Email Verified!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Thank you for verifying your email address. Your account is now fully activated.
                </p>
                <div className="mb-6">
                  <div className="inline-block animate-pulse bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm py-1 px-2 rounded">
                    Redirecting to login in 5 seconds...
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => router.push(ROUTES.AUTH.LOGIN)}
                >
                  Login Now
                </Button>
              </div>
            ) : (
              <div>
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Verification Failed</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error}
                </p>
                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    onClick={() => router.push(ROUTES.AUTH.LOGIN)}
                  >
                    Go to Login
                  </Button>
                  <div>
                    <Link 
                      href="/resend-verification" 
                      className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Resend verification email
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </Card>
    </div>
  );
}