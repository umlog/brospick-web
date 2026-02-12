import { useState } from 'react';

export function useAdminAuth() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => setIsAuthenticated(true);
  const handleAuthFailure = () => setIsAuthenticated(false);

  return {
    password,
    setPassword,
    isAuthenticated,
    handleLoginSuccess,
    handleAuthFailure,
  };
}
