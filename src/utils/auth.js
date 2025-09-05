'use client';

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({
  isAuthenticated: false,
  signIn: async () => false,
  signOut: async () => false,
});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check");
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
    }
  };

  const signIn = async ({ token, authUserState }) => {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, authUserState }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error signing in:", error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });
      if (response.ok) {
        setIsAuthenticated(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
      });
      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      }
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      setIsAuthenticated(false);
      return false;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(refreshToken, 1800 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);