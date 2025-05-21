// frontend/src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROUTES } from '@/config/routes';
import { APP_NAME } from '@/config/constants';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { Stepper } from '@/components/ui/Stepper';

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const steps = [
    { id: 1, label: 'Account' },
    { id: 2, label: 'Profile' },
    { id: 3, label: 'Complete' },
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleRegisterSuccess = () => {
    setCurrentStep(3);
    // After a delay, redirect to login
    setTimeout(() => {
      router.push(ROUTES.AUTH.LOGIN);
    }, 3000);
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
              Create your account
            </p>
          </div>

          <Stepper
            steps={steps}
            currentStep={currentStep}
            onChange={handleStepChange}
          />

          {currentStep === 1 && (
            <RegisterForm onSuccess={() => handleStepChange(2)} />
          )}

          {currentStep === 2 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">
                Complete your profile
              </h3>
              <div className="space-y-4">
                {/* Profile completion form would go here */}
                <div className="flex justify-end">
                  <button
                    onClick={handleRegisterSuccess}
                    className="btn btn-primary"
                  >
                    Complete Registration
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="mt-6 text-center">
              <div className="rounded-full bg-green-100 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-green-500"
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
                Registration Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your account has been created successfully. Please check your
                email to verify your account.
              </p>
              <div className="inline-block">
                <div className="animate-pulse bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm py-1 px-2 rounded">
                  Redirecting to login...
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href={ROUTES.AUTH.LOGIN}
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
