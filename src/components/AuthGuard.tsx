import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#212121]">
        <div className="w-5 h-5 rounded-full border-2 border-[#10a37f] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
