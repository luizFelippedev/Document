// frontend/src/components/auth/TwoFactorForm.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Alert } from "../ui/Alert";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, RefreshCw } from "lucide-react";

interface TwoFactorFormProps {
  onSuccess: () => void;
}

export const TwoFactorForm = ({ onSuccess }: TwoFactorFormProps) => {
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyTwoFactorCode, resendTwoFactorCode } = useAuth();

  useEffect(() => {
    // Focus the first input field on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Start countdown for resend option
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;

    // Update the code array
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input if this one is filled
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Navigate between inputs with arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData) {
      const newCode = [...verificationCode];
      for (let i = 0; i < pastedData.length; i++) {
        if (i < 6) {
          newCode[i] = pastedData[i];
        }
      }
      setVerificationCode(newCode);

      // Focus the last filled input
      const lastIndex = Math.min(pastedData.length - 1, 5);
      if (lastIndex >= 0 && inputRefs.current[lastIndex]) {
        inputRefs.current[lastIndex].focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = verificationCode.join("");
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await verifyTwoFactorCode(code);
      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Invalid verification code. Please try again.",
      );

      // Reset the code fields on error
      setVerificationCode(["", "", "", "", "", ""]);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      await resendTwoFactorCode();
      setCanResend(false);
      setCountdown(30);

      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to resend verification code. Please try again.",
      );
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 w-16 h-16 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
          Enter the 6-digit code sent to your email or authentication app
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4"
          >
            <Alert message={error} type="error" />
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {verificationCode.map((digit, index) => (
            <Input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              ref={(el) => (inputRefs.current[index] = el)}
              className="w-12 h-12 text-center text-xl"
              state={error ? "error" : "default"}
              variant="filled"
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          loadingText="Verifying..."
          disabled={verificationCode.join("").length !== 6 || isSubmitting}
        >
          Verify
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Didn't receive the code?
        </p>
        <button
          type="button"
          onClick={handleResendCode}
          disabled={!canResend}
          className={`text-sm flex items-center justify-center mx-auto ${
            canResend
              ? "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
          }`}
        >
          <RefreshCw size={14} className="mr-1" />
          Resend Code {!canResend && `(${countdown}s)`}
        </button>
      </div>
    </div>
  );
};
