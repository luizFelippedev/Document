// frontend/src/app/(auth)/reset-password/[token]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ROUTES } from "@/config/routes";
import { APP_NAME } from "@/config/constants";
import { AnimatedLogo } from "@/components/ui/AnimatedLogo";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { authService } from "@/services/auth.service";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await authService.verifyResetToken(params.token);
        setIsValid(true);
      } catch (error) {
        setIsValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [params.token]);

  const handleResetSuccess = () => {
    setResetComplete(true);
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push(ROUTES.AUTH.LOGIN);
    }, 3000);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
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
              {resetComplete
                ? "Password Reset Successful"
                : "Reset your password"}
            </p>
          </div>

          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="large" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Verifying your reset link...
                </p>
              </div>
            ) : !isValid ? (
              <div className="text-center py-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="h-8 w-8 text-red-500 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Invalid or Expired Link
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This password reset link is invalid or has expired. Please
                  request a new link.
                </p>
                <Link
                  href={ROUTES.AUTH.FORGOT_PASSWORD}
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Request a new reset link
                </Link>
              </div>
            ) : resetComplete ? (
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
                  Password Reset Successful
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your password has been successfully reset. You can now use
                  your new password to log in.
                </p>
                <div className="inline-block">
                  <div className="animate-pulse bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm py-1 px-2 rounded">
                    Redirecting to login...
                  </div>
                </div>
              </div>
            ) : (
              <>
                <ResetPasswordForm
                  token={params.token}
                  onSuccess={handleResetSuccess}
                />

                <div className="mt-6 text-center">
                  <Link
                    href={ROUTES.AUTH.LOGIN}
                    className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to login
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
