// frontend/src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { TwoFactorForm } from "@/components/auth/TwoFactorForm";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP_NAME } from "@/config/constants";
import { AnimatedLogo } from "@/components/ui/AnimatedLogo";

export default function LoginPage() {
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const router = useRouter();

  const handleLoginSuccess = (requiresTwoFactor: boolean) => {
    if (requiresTwoFactor) {
      setShowTwoFactor(true);
    } else {
      router.push(ROUTES.DASHBOARD.ROOT);
    }
  };

  const handleTwoFactorSuccess = () => {
    router.push(ROUTES.DASHBOARD.ROOT);
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
              Sign in to your account
            </p>
          </div>

          {showTwoFactor ? (
            <TwoFactorForm onSuccess={handleTwoFactorSuccess} />
          ) : (
            <>
              <LoginForm onSuccess={handleLoginSuccess} />

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={() => {
                      /* Implement OAuth */
                    }}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={() => {
                      /* Implement OAuth */
                    }}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.341-3.369-1.341-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.699 1.028 1.592 1.028 2.683 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.577.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"
                      />
                    </svg>
                    GitHub
                  </Button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href={ROUTES.AUTH.FORGOT_PASSWORD}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Link
                    href={ROUTES.AUTH.REGISTER}
                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
