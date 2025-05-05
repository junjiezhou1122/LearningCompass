import { useEffect } from 'react';

const CourseDetailDebug = () => {
  useEffect(() => {
    console.log('CourseDetailDebug mounted');
    // Try to catch any errors
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled rejection:', event.reason);
    });
    
    return () => {
      console.log('CourseDetailDebug unmounted');
    };
  }, []);
  
  return null;
};

export default CourseDetailDebug;
