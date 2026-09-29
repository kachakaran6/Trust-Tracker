import React, { createContext, useContext, useState, useEffect } from "react";
import { api, authStorage } from "../lib/api";
import { User } from "../types";
import { detectUserCurrency } from "../utils/currency";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, options?: { currency?: string; timezone?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.auth
      .me()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        authStorage.clearToken();
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await api.auth.login({ email, password });
      authStorage.setToken(res.token);
      setUser(res.user);
      toast.success(res.message || "Login successful!");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    options?: { currency?: string; timezone?: string }
  ) => {
    try {
      setIsLoading(true);
      const autodetectedCurrency = detectUserCurrency();
      const autodetectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const res = await api.auth.register({
        name,
        email,
        password,
        currency: options?.currency || autodetectedCurrency,
        timezone: options?.timezone || autodetectedTimezone,
      });

      authStorage.setToken(res.token);
      setUser(res.user);
      toast.success("Account created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    toast.info("Logged out successfully");
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error("No user logged in");
    try {
      const res = await api.auth.updateProfile(updates);
      setUser(res.user);
      toast.success(res.message || "Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
