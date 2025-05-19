import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/axios';
import { User } from '@/types/user';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  updateUser: (user: User) => void;
}

interface SignInCredentials {
  email: string;
  password: string;
}

const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const token = localStorage.getItem('@App:token');

      if (token) {
        api.defaults.headers.authorization = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      }
    } catch (error) {
      signOut();
    } finally {
      setLoading(false);
    }
  }

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('@App:token', token);
      api.defaults.headers.authorization = `Bearer ${token}`;

      setUser(user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  }

  function signOut() {
    localStorage.removeItem('@App:token');
    setUser(null);
    router.push('/auth/login');
  }

  function updateUser(userData: User) {
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      signIn,
      signOut,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);