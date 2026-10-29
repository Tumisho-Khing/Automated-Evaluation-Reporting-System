import { useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorState from '@/components/ErrorState';
import { Lock, LogOut } from 'lucide-react';

const ADMIN_EMAIL = 'maphallaamari@gmail.com';
const ADMIN_PASSWORD = 'admin123';
const LOCAL_SESSION_KEY = 'nti_admin_auth_v1';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [session, setSession] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Check local admin session
    const localSession = localStorage.getItem(LOCAL_SESSION_KEY);
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession);
        if (parsed?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setSession(parsed);
          setLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
    }

    // 2. Check Supabase session if configured
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
        if (sbSession) {
          setSession(sbSession);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, sbSession) => {
        if (sbSession) {
          setSession(sbSession);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password;

    try {
      // Direct credential check for maphallaamari@gmail.com
      if (inputEmail === ADMIN_EMAIL.toLowerCase() && inputPassword === ADMIN_PASSWORD) {
        const adminSession = {
          user: { email: ADMIN_EMAIL, role: 'admin' },
          email: ADMIN_EMAIL,
          authenticatedAt: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(adminSession));
        setSession(adminSession);

        // Also attempt Supabase Auth sign-in in the background if configured
        if (isSupabaseConfigured()) {
          supabase.auth.signInWithPassword({ email: inputEmail, password: inputPassword }).catch((err) => {
            console.warn('Supabase Auth sync note:', err?.message || err);
          });
        }
        return;
      }

      // If credentials didn't match direct check, try Supabase Auth if configured
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: inputEmail,
          password: inputPassword,
        });

        if (error) {
          setAuthError(error.message || 'Invalid email or password.');
          return;
        }

        if (data?.session) {
          setSession(data.session);
          return;
        }
      }

      setAuthError('Invalid credentials. Please enter valid administrative credentials.');
    } catch (err: unknown) {
      setAuthError((err as Error).message || 'Failed to authenticate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setSession(null);
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner label="Verifying authentication..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-nti-navy/10 text-nti-navy rounded-full flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Authentication</h2>
          <p className="text-sm text-gray-500 mt-1">
            Access to attendance records & student data requires administrative authorization.
          </p>
        </div>

        {authError && (
          <div className="mb-4">
            <ErrorState message={authError} />
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nti-navy focus:border-transparent outline-none transition"
              placeholder="newbridge@nti.ac.za"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nti-navy focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Sign In as Admin'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-slate-800 text-slate-200 px-4 py-2 text-xs flex items-center justify-between border-b border-slate-700">
        <span>Admin Mode: Authenticated ({ADMIN_EMAIL})</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 text-slate-300 hover:text-white transition"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
      {children}
    </div>
  );
}
