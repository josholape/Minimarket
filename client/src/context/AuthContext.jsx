import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  function saveSession(user, token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setUser(user);
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    saveSession(res.data.user, res.data.token);
  }

  async function register(name, email, password) {
    const res = await api.post('/auth/register', { name, email, password });
    saveSession(res.data.user, res.data.token);
  }

  function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}