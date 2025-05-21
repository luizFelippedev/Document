// src/components/auth/LoginForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { saveToStorage } from '@/utils/storage';
import { API_URL } from '@/config/constants';

// Schema de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  onSuccess: (requiresTwoFactor: boolean) => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginEndpoint, setLoginEndpoint] = useState('/api/auth/login');

  // Determina o endpoint correto baseado na URL da API
  useEffect(() => {
    // Evita duplicação de /api na URL
    const endpoint = API_URL.endsWith('/api') 
      ? '/auth/login' 
      : '/api/auth/login';
    
    setLoginEndpoint(endpoint);
    console.log('Endpoint de login configurado:', endpoint);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  // Função para preencher as credenciais de admin padrão
  const fillDefaultAdmin = () => {
    setValue('email', 'admin@example.com');
    setValue('password', 'Admin@123');
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // Exibir dados de login enviados (remova em produção)
      console.log('Tentando login com:', {
        email: data.email,
        remember: data.remember,
      });
      
      // Log da URL completa para depuração
      console.log('URL completa de login:', API_URL + loginEndpoint);

      // Verifica se está tentando com o admin padrão
      const isDefaultAdmin = 
        data.email === 'admin@example.com' && data.password === 'Admin@123';
      
      if (isDefaultAdmin) {
        console.log('Tentando login com credenciais de admin padrão');
      }

      const response = await api.post(loginEndpoint, {
        email: data.email,
        password: data.password,
        remember: data.remember || false,
      });

      // Processar resposta bem-sucedida
      const { token, user, requireTwoFactor } = response.data.data;

      // Salvar token com base na opção "lembrar"
      if (data.remember) {
        saveToStorage('@App:token', token);
      } else {
        sessionStorage.setItem('@App:token', token);
      }

      // Salvar usuário
      saveToStorage('@App:user', JSON.stringify(user));

      console.log('Login bem-sucedido:', { 
        user: { id: user.id, email: user.email, role: user.role },
        requireTwoFactor 
      });

      // Notificar componente pai do sucesso
      onSuccess(requireTwoFactor || false);
    } catch (error: any) {
      console.error('Erro de login:', error);

      let errorMessage = 'Falha no login. Tente novamente.';

      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data
        });

        if (error.response.status === 401) {
          // Se for primeira vez, sugere usar o admin padrão
          if (data.email !== 'admin@example.com') {
            errorMessage = 'Email ou senha inválidos. Tente com admin@example.com / Admin@123';
          } else {
            errorMessage = 'Credenciais inválidas. Verifique se o servidor foi reiniciado após a configuração.';
          }
        } else if (error.response.status === 404) {
          errorMessage = 'Endpoint de login não encontrado. Verifique a configuração da API.';
        } else {
          // Outras mensagens de erro do backend
          errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
        }
      } else if (error.request) {
        // Erro de conexão
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
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

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email" // Adicionado para atender recomendações de acessibilidade
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Senha
            </label>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password" // Adicionado para atender recomendações de acessibilidade
            {...register('password')}
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              {...register('remember')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="remember"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Lembrar-me
            </label>
          </div>

          {/* Botão para usar admin padrão (apenas para desenvolvimento) */}
          {process.env.NODE_ENV !== 'production' && (
            <button
              type="button"
              onClick={fillDefaultAdmin}
              className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Usar admin padrão
            </button>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? <Spinner className="mr-2" /> : null}
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}