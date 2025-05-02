import { useEffect, useState } from 'react';

export function useHeroAnimation() {
  // Animation states
  const [isLoaded, setIsLoaded] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState(0);
  
  // Set loaded state after component mounts
  useEffect(() => {
    setIsLoaded(true);
    
    // Floating animation for the circles
    const floatingInterval = setInterval(() => {
      setFloatingPosition(prev => (prev + 1) % 100);
    }, 50);
    
    return () => clearInterval(floatingInterval);
  }, []);
  
  return {
    isLoaded,
    floatingPosition
  };
}
