import { useState } from 'react';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => setIsAuthenticated(true);
  const handleAuthFailure = () => setIsAuthenticated(false);

  return {
    isAuthenticated,
    isLoading: false,
    handleLoginSuccess,
    handleAuthFailure,
  };
}
