import React, { createContext, useContext, useMemo, useState } from 'react';

export const EmployeeAuthContext = createContext(null);

export const EmployeeAuthProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const token = localStorage.getItem('employee_token');
    const userRaw = localStorage.getItem('employee_user');
    const user = userRaw && userRaw !== 'null' && userRaw !== 'undefined' ? JSON.parse(userRaw) : null;
    return token && user ? { token, user } : null;
  });

  const login = async (emailOrPhone, password) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/employee/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('employee_token', data.token);
    localStorage.setItem('employee_user', JSON.stringify(data.user));
    setState({ token: data.token, user: data.user });
  };

  const setAuth = (token, user) => {
    if (token) localStorage.setItem('employee_token', token);
    if (user) localStorage.setItem('employee_user', JSON.stringify(user));
    setState(token && user ? { token, user } : null);
  };

  const logout = () => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_user');
    setState(null);
  };

  const value = useMemo(() => ({ employee: state, login, logout, setAuth }), [state]);
  return <EmployeeAuthContext.Provider value={value}>{children}</EmployeeAuthContext.Provider>;
};

export const useEmployeeAuth = () => useContext(EmployeeAuthContext);
