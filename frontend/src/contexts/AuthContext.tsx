// frontend/src/contexts/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/axios";
import { toast } from "react-hot-toast";
import { User } from "@/types/user";
import { ROUTES } from "@/config/routes";

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ requiresTwoFactor: boolean }>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  verifyTwoFactorCode: (code: string) => Promise<void>;
  resendTwoFactorCode: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  setTwoFactorAuth: (enabled: boolean) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData,
);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state
  useEffect(() => {
    loadUserData();
  }, []);

  // Check for protected routes
  useEffect(() => {
    if (!initialized) return;

    const isAuthRoute = pathname?.startsWith("/auth");
    const isProtectedRoute = !isAuthRoute && pathname !== "/";

    if (isProtectedRoute && !isAuthenticated && !loading) {
      // Redirect to login if attempting to access protected route while not authenticated
      router.push(ROUTES.AUTH.LOGIN);
    } else if (isAuthRoute && isAuthenticated && !loading) {
      // Redirect to dashboard if already authenticated and trying to access auth routes
      router.push(ROUTES.DASHBOARD.ROOT);
    }
  }, [pathname, initialized, loading]);

  const isAuthenticated = !!user;

  async function loadUserData() {
    try {
      setLoading(true);
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("@App:token") ||
            sessionStorage.getItem("@App:token")
          : null;

      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.authorization = `Bearer ${storedToken}`;
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      }
    } catch (error) {
      // Clear invalid tokens
      localStorage.removeItem("@App:token");
      sessionStorage.removeItem("@App:token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }

  async function login(email: string, password: string, rememberMe = false) {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user, requiresTwoFactor } = response.data;

      // If 2FA is required, we'll set the token but not the user yet
      // The token is needed for the 2FA verification API call
      if (requiresTwoFactor) {
        api.defaults.headers.authorization = `Bearer ${token}`;
        setToken(token);

        // Store token temporarily (will be replaced after 2FA verification)
        sessionStorage.setItem("@App:temp_token", token);

        return { requiresTwoFactor: true };
      }

      // No 2FA required, proceed with normal login
      if (rememberMe) {
        localStorage.setItem("@App:token", token);
      } else {
        sessionStorage.setItem("@App:token", token);
      }

      api.defaults.headers.authorization = `Bearer ${token}`;
      setToken(token);
      setUser(user);

      toast.success(`Welcome back, ${user.name}!`);

      return { requiresTwoFactor: false };
    } catch (error) {
      throw error;
    }
  }

  async function verifyTwoFactorCode(code: string) {
    try {
      const tempToken = sessionStorage.getItem("@App:temp_token");

      if (!tempToken) {
        throw new Error("Authentication error. Please try logging in again.");
      }

      const response = await api.post("/auth/verify-2fa", { code });
      const { token, user } = response.data;

      // Replace temporary token with the authenticated token
      localStorage.setItem("@App:token", token);
      sessionStorage.removeItem("@App:temp_token");

      api.defaults.headers.authorization = `Bearer ${token}`;
      setToken(token);
      setUser(user);

      toast.success(`Welcome back, ${user.name}!`);
    } catch (error) {
      throw error;
    }
  }

  async function resendTwoFactorCode() {
    try {
      await api.post("/auth/resend-2fa");
      toast.success("A new verification code has been sent");
    } catch (error) {
      throw error;
    }
  }

  async function register(data: RegisterData) {
    try {
      await api.post("/auth/register", data);
      toast.success(
        "Account created successfully! Please check your email to verify your account.",
      );
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("@App:token");
      sessionStorage.removeItem("@App:token");
      sessionStorage.removeItem("@App:temp_token");
      setToken(null);
      setUser(null);

      // Clear auth headers
      delete api.defaults.headers.authorization;

      router.push(ROUTES.AUTH.LOGIN);
    }
  }

  async function updateUser(userData: Partial<User>) {
    try {
      const response = await api.put("/users/profile", userData);
      setUser(response.data.user);
      toast.success("Profile updated successfully");
    } catch (error) {
      throw error;
    }
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    try {
      await api.put("/auth/password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password updated successfully");
    } catch (error) {
      throw error;
    }
  }

  async function setTwoFactorAuth(enabled: boolean) {
    try {
      const response = await api.post("/auth/2fa/setup", { enabled });

      if (enabled) {
        return response.data; // Returns QR code data
      } else {
        toast.success("Two-factor authentication disabled");
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async function forgotPassword(email: string) {
    try {
      await api.post("/auth/forgot-password", { email });
    } catch (error) {
      throw error;
    }
  }

  async function resetPassword(token: string, password: string) {
    try {
      await api.post("/auth/reset-password", { token, password });
    } catch (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        verifyTwoFactorCode,
        resendTwoFactorCode,
        updateUser,
        updatePassword,
        setTwoFactorAuth,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
