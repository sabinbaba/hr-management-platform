import { createContext, useState, useEffect } from 'react';
import api, { registerSessionExpiredHandler } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    registerSessionExpiredHandler(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setSessionExpired(true);
    });
  }, []);

  async function login(email, password) {
    setSessionExpired(false);
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedInUser } = res.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    return loggedInUser;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}
