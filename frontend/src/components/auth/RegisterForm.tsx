// frontend/src/components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Alert } from "../ui/Alert";
import { Spinner } from "../ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (password) => /[A-Z]/.test(password),
        "Password must contain at least one uppercase letter",
      )
      .refine(
        (password) => /[a-z]/.test(password),
        "Password must contain at least one lowercase letter",
      )
      .refine(
        (password) => /[0-9]/.test(password),
        "Password must contain at least one number",
      )
      .refine(
        (password) => /[^A-Za-z0-9]/.test(password),
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = watch("password");

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
    if (passwordStrength < 30) return "bg-red-500";
    if (passwordStrength < 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength < 30) return "Weak";
    if (passwordStrength < 60) return "Moderate";
    if (passwordStrength < 80) return "Strong";
    return "Very Strong";
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Simulate API call
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to create account. Please try again.",
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
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your full name"
          error={errors.name?.message}
          leftElement={<User size={18} />}
          {...register("name")}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          error={errors.email?.message}
          leftElement={<Mail size={18} />}
          {...register("email")}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Password
        </label>
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a password"
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
          {...register("password")}
        />

        {password && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Password strength:
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: getStrengthColor().replace("bg-", "text-") }}
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
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm your password"
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
          {...register("confirmPassword")}
        />
      </div>

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="acceptTerms"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            {...register("acceptTerms")}
          />
        </div>
        <label
          htmlFor="acceptTerms"
          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
        >
          I agree to the{" "}
          <a
            href="/terms"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Privacy Policy
          </a>
        </label>
      </div>
      {errors.acceptTerms && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {errors.acceptTerms.message}
        </p>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          loadingText="Creating Account..."
        >
          Create Account
        </Button>
      </div>
    </form>
  );
};
