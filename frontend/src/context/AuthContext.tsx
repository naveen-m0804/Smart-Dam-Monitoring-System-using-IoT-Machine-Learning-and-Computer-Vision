import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("smartDamUser");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    if (username === "admin" && password === "admin123") {
      const u = { name: "admin", role: "admin" };
      setUser(u);
      window.localStorage.setItem("smartDamUser", JSON.stringify(u));
      return { success: true };
    }
    return { success: false, message: "Invalid credentials" };
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem("smartDamUser");
  };

  const value = {
    user,
    isAdmin: user?.role === "admin",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
