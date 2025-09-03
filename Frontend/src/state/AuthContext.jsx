import { createContext, useContext, useMemo, useState } from "react";

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (u) => {
    setUser(u);
    sessionStorage.setItem("user", JSON.stringify(u));
  };
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("user");
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
