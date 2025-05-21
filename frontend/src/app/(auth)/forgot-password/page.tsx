'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROUTES } from '@/config/routes';
import { APP_NAME } from '@/config/constants';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSuccess = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setEmailSent(true);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {APP_NAME}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {emailSent ? 'Link de redefinição enviado' : 'Redefina sua senha'}
            </p>
          </div>

          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            {emailSent ? (
              <div className="text-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="h-8 w-8 text-green-500 dark:text-green-400"
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Confira sua caixa de entrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Não se preocupe, enviaremos um link para você redefinir sua senha.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Não lembra da sua senha? Sem problemas!
                </p>
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <ForgotPasswordForm onSuccess={handleSuccess} />

                <div className="mt-6 text-center">
                  <Link
                    href={ROUTES.AUTH.LOGIN}
                    className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Voltar para login
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </Card>
    </div>
  );
}
