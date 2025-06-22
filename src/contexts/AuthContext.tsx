// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, User } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🔍 AuthContext: checking session");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("🔁 initial session:", session);
      if (session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          email: u.email!,
          name: u.user_metadata.name || "",
          avatar_url: u.user_metadata.avatar_url,
          currency: u.user_metadata.currency || "USD",
          timezone: u.user_metadata.timezone || "UTC",
        });
      }
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("📡 auth state change:", event, session);
        if (session?.user) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email!,
            name: u.user_metadata.name || "",
            avatar_url: u.user_metadata.avatar_url,
            currency: u.user_metadata.currency || "USD",
            timezone: u.user_metadata.timezone || "UTC",
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("🚪 login attempt:", email);
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("🧾 login result:", data, error);
    setIsLoading(false);
    if (error) throw error;
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, currency: "USD", timezone: "UTC" } },
    });
    console.log("👤 register result:", data, error);
    setIsLoading(false);
    if (error) throw error;
  };

  const logout = async () => {
    console.log("🔐 logging out");
    await supabase.auth.signOut();
    setUser(null);
    console.log("🔐 logged out");
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
