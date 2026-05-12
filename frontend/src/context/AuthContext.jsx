import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only attempt session restore if we previously set the session flag.
    // The HttpOnly cookie is sent automatically — no token in localStorage.
    const sessionActive = localStorage.getItem("session") === "true";
    if (!sessionActive) {
      setLoading(false);
      return;
    }
    authAPI.me()
      .then(r => {
        setUser(r.data);
        localStorage.setItem("user", JSON.stringify(r.data));
      })
      .catch(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("session");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const res  = await authAPI.login({ username, password });
    const data = res.data;
    // Token is in the HttpOnly cookie set by the server — never stored here
    localStorage.setItem("session", "true");
    const perfil = { nombre: data.nombre, username: data.username, rol: data.rol };
    localStorage.setItem("user", JSON.stringify(perfil));
    setUser(perfil);
    return data;
  }, []);

  const logout = useCallback(() => {
    // Clear local state synchronously so the UI updates immediately
    localStorage.removeItem("user");
    localStorage.removeItem("session");
    setUser(null);
    // Ask the server to clear the HttpOnly cookie (fire-and-forget)
    authAPI.logout().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.rol === "ADMIN" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
