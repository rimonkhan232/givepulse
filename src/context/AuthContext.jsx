import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await api.auth.me();
        setUser(me);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async ({ email, password }) => {
    try {
      const { token, user: loggedIn } = await api.auth.login({ email, password });
      setToken(token);
      setUser(loggedIn);
      return { ok: true, user: loggedIn };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const register = async ({ fullName, email, password }) => {
    try {
      const { token, user: created } = await api.auth.register({ fullName, email, password });
      setToken(token);
      setUser(created);
      return { ok: true, user: created };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const resetPassword = async ({ email, newPassword }) => {
    try {
      await api.auth.resetPassword({ email, newPassword });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const refreshUser = async () => {
    try {
      const { user: me } = await api.auth.me();
      setUser(me);
    } catch {
      // ignore -- session may have expired, next protected call will catch it
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
