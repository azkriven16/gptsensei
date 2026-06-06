import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, UserRound, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type Status = 'idle' | 'loading' | 'sent' | 'error';

export default function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && session) {
      navigate('/app', { replace: true });
    }
  }, [session, loading, navigate]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStatus('sent');
    setMessage('Check your email for a magic link.');
  }

  async function handleContinueAsGuest() {
    setStatus('loading');
    setMessage('');

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      setStatus('error');
      setMessage(`${error.message} — Enable Anonymous sign-ins in your Supabase Auth settings.`);
      return;
    }

    if (!data.user) {
      setStatus('error');
      setMessage('No guest session returned. Check Anonymous sign-ins in Supabase Auth settings.');
      return;
    }

    navigate('/app');
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] font-sans flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-10 opacity-70 hover:opacity-100 transition-opacity">
        <Sparkles className="w-5 h-5 text-[#10a37f]" />
        <span className="font-bold text-white text-lg tracking-tight">GPT Senpai</span>
      </Link>

      <div className="w-full max-w-sm bg-[#2f2f2f]/30 border border-white/8 rounded-2xl p-8 flex flex-col gap-5">

        <div>
          <p className="text-[#10a37f] text-xs font-semibold uppercase tracking-widest mb-2">Welcome</p>
          <h1 className="text-white text-2xl font-bold leading-tight">Continue without sign-in</h1>
          <p className="text-white/40 text-sm mt-1.5 leading-relaxed">
            Use a guest account instantly, or sign in with a magic link to save your history across devices.
          </p>
        </div>

        {/* Guest button */}
        <button
          type="button"
          onClick={handleContinueAsGuest}
          disabled={status === 'loading'}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#10a37f] hover:bg-[#0d8a6a] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserRound className="w-4 h-4" />
          {status === 'loading' ? 'Starting...' : 'Continue as guest'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 text-white/20 text-xs">
          <div className="flex-grow h-px bg-white/8" />
          Optional — sign in with email
          <div className="flex-grow h-px bg-white/8" />
        </div>

        {/* Magic link form */}
        <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-white/50 text-xs font-medium">Email address</span>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus-within:border-[#10a37f]/50 transition-colors">
              <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
              <input
                required
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={status === 'loading' || status === 'sent'}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending...' : status === 'sent' ? 'Link sent!' : 'Send magic link'}
          </button>
        </form>

        {/* Status message */}
        {message && (
          <p className={`text-xs text-center ${status === 'error' ? 'text-rose-400' : 'text-[#10a37f]'}`}>
            {message}
          </p>
        )}
      </div>

      <p className="mt-6 text-white/20 text-xs text-center">
        No password required · Guest sessions are private to this browser
      </p>
    </div>
  );
}
