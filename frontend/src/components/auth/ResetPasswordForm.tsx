// frontend/src/components/auth/ResetPasswordForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine(
        (password) => /[A-Z]/.test(password),
        'Password must contain at least one uppercase letter',
      )
      .refine(
        (password) => /[a-z]/.test(password),
        'Password must contain at least one lowercase letter',
      )
      .refine(
        (password) => /[0-9]/.test(password),
        'Password must contain at least one number',
      )
      .refine(
        (password) => /[^A-Za-z0-9]/.test(password),
        'Password must contain at least one special character',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

export const ResetPasswordForm = ({
  token,
  onSuccess,
}: ResetPasswordFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Calculate password strength
  useState(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character types
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // Normalize to 0-100
    setPasswordStrength(Math.min(100, (strength / 6) * 100));
  });

  const getStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Moderate';
    if (passwordStrength < 80) return 'Strong';
    return 'Very Strong';
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await authService.resetPassword(token, data.password);
      onSuccess();
    } catch (err: unknown) {
      setError(
        err.response?.data?.message ||
          'Failed to reset password. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Alert message={error} type="error" />
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          New Password
        </label>
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your new password"
          error={errors.password?.message}
          leftElement={<Lock size={18} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          {...register('password')}
        />

        {password && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Password strength:
              </span>
              <span
                className="text-xs font-medium"
                style={{
                  color: getStrengthColor().replace('bg-', 'text-'),
                }}
              >
                {getStrengthText()}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                style={{ width: `${passwordStrength}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm your new password"
          error={errors.confirmPassword?.message}
          leftElement={<Lock size={18} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="focus:outline-none"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          {...register('confirmPassword')}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          loadingText="Resetting Password..."
        >
          Reset Password
        </Button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          Make sure to use a strong password that you haven't used elsewhere.
        </p>
      </div>
    </form>
  );
};
