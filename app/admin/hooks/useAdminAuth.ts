import { useState, useEffect } from 'react';

export function useAdminAuth() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin-token')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.token) {
          setPassword(data.token);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleLoginSuccess = () => setIsAuthenticated(true);
  const handleAuthFailure = () => setIsAuthenticated(false);

  return {
    password,
    setPassword,
    isAuthenticated,
    isLoading,
    handleLoginSuccess,
    handleAuthFailure,
  };
}
