// frontend/src/components/auth/TwoFactorForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/lib/axios';

const totpSchema = z.object({
  token: z.string().min(6, 'Código inválido').max(6, 'Código inválido'),
});

type TotpFormValues = z.infer<typeof totpSchema>;

type TwoFactorFormProps = {
  onSuccess: () => void;
};

export function TwoFactorForm({ onSuccess }: TwoFactorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TotpFormValues>({
    resolver: zodResolver(totpSchema),
    defaultValues: {
      token: '',
    },
  });

  const onSubmit = async (data: TotpFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      await api.post('/api/auth/totp/login-verify', {
        token: data.token,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro de verificação 2FA:', error);

      let errorMessage = 'Falha na verificação. Tente novamente.';

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div>
        <label
          htmlFor="token"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Código de verificação
        </label>
        <Input
          id="token"
          type="text"
          placeholder="000000"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          {...register('token')}
          className={errors.token ? 'border-red-500' : ''}
        />
        {errors.token && (
          <p className="mt-1 text-sm text-red-500">{errors.token.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? <Spinner className="mr-2" /> : null}
        {isLoading ? 'Verificando...' : 'Verificar'}
      </Button>
    </form>
  );
}