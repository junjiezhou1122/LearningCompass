import NotesPanel from '../components/notes/NotesPanel';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';

const NotesPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Show loading state if auth status is still loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Use navigate for redirection instead of Navigate component
    navigate('/login');
    return null;
  }

  return <NotesPanel />;
};

export default NotesPage;
