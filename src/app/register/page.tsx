'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('email limit exceeded')) {
        setError("Rate limit reached: Too many registration attempts. Please wait a few minutes or increase the signup limit in Supabase Dashboard (Auth > Settings).");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // 2. Add user to our public.users table to initialize balance
    // 2. Add user to our public.users table to initialize balance
    if (authData.user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          { id: authData.user.id, email: email, balance: 0.00 }
        ]);
        
      if (dbError) {
        console.warn("User profile creation delayed. Dashboard will retry.", dbError.message);
      }
    }

    router.replace('/dashboard');
  };

  const handleGoogleRegister = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    });
    if (error) {
      if (error.message.includes('provider is not enabled')) {
        setError("Google login is not enabled in the Supabase dashboard. Please enable it in Authentication > Providers.");
      } else {
        setError(error.message);
      }
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8 rounded-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-brand-silver-dark">Start trading with zero fees</p>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-silver-dark mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-silver-dark" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-brand-silver-dark/50 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-silver-dark mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-silver-dark" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-brand-silver-dark/50 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'} 
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-brand-silver-dark bg-[#0a0f1c]">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleRegister}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg py-3 font-semibold transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-brand-silver-dark">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-blue hover:text-brand-blue-dark font-medium transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
