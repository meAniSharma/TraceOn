import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getSession, logIn, logOut, signUp } from '../lib/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession);

  const signup = useCallback(async (details) => {
    const r = await signUp(details);
    if (r.ok) setUser(r.user);
    return r;
  }, []);

  const login = useCallback(async (details) => {
    const r = await logIn(details);
    if (r.ok) setUser(r.user);
    return r;
  }, []);

  const logout = useCallback(() => { logOut(); setUser(null); }, []);

  const value = useMemo(() => ({ user, signup, login, logout }), [user, signup, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
