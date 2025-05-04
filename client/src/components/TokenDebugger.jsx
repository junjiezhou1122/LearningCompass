import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function TokenDebugger() {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // Log authentication state and token
    console.log('Authentication state:', isAuthenticated);
    console.log('Token in localStorage:', localStorage.getItem('token'));
    console.log('AuthToken in localStorage:', localStorage.getItem('authToken'));
  }, [isAuthenticated]);
  
  return null; // This component doesn't render anything
}
