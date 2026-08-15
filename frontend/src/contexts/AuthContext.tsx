import React, { createContext, useState, useEffect, useContext } from "react";
import { api } from "../services/api";

interface User {
  id: string;
  email: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    
    // Safety timer to prevent being stuck infinitely on the loading spinner if network hangs
    const safetyTimer = setTimeout(() => {
      console.warn("Auth check timeout reached. Unblocking loading screen.");
      setLoading(false);
    }, 5000);

    try {
      const response = await api.get("/auth/me", { timeout: 4500 });
      setUser(response.data);
    } catch (err) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password }, { timeout: 90000 });
      const { access_token, refresh_token } = response.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      
      const meRes = await api.get("/auth/me", { timeout: 30000 });
      setUser(meRes.data);
    } catch (err) {
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await api.post("/auth/register", { email, password }, { timeout: 90000 });
      // Login automatically upon successful signup
      await login(email, password);
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export type { User };
