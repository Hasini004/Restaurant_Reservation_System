import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginUser, registerUser, fetchCurrentUser } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session

  // On first load, if a token exists, verify it against the API so a
  // stale/expired token doesn't leave the UI thinking the user is logged in.
  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: currentUser } = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedInUser } = await loginUser({ email, password });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user: newUser } = await registerUser(payload);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
