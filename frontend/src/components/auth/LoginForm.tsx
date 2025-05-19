// frontend/src/components/auth/LoginForm.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Alert } from "../ui/Alert";
import { Spinner } from "../ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(1, "Password is required"),
  rememberMe: z
    .boolean()
    .optional()
    .default(false)
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: (requiresTwoFactor: boolean) => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Simulate the login API call with potential 2FA requirement
      const response = await login(data.email, data.password, data.rememberMe);
      
      // Check if 2FA is required based on the API response
      const requiresTwoFactor = response?.requiresTwoFactor || false;
      
      onSuccess(requiresTwoFactor);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        "Failed to login. Please check your credentials and try again."
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
        <div className="flex items-center justify-between mb-1">
          <label 
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
        </div>
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
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
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            {...register("rememberMe")}
          />
          <label 
            htmlFor="rememberMe" 
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Remember me
          </label>
        </div>
      </div>
      
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          loadingText="Signing In..."
        >
          Sign In
        </Button>
      </div>
    </form>
  );
};