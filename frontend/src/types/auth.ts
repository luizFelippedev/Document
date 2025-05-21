// frontend/src/types/auth.ts
// Authentication related types

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    avatar?: string | null;
  };
  requiresTwoFactor: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
  token: string;
}

export interface TwoFactorVerifyData {
  code: string;
}

export interface TwoFactorSetupResponse {
  qrCodeUrl: string;
  secret: string;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    avatar?: string | null;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
  iat: number;
  exp: number;
}
