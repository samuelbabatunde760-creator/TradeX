'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/app/components/LanguageContext';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login Error:", error);
      setError(error.message || t('auth.loginError'));
      setLoading(false);
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/10 blur-[120px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -ml-64 -mb-64" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl border-white/10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-blue/20">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('auth.welcomeBack')}</h1>
            <p className="text-brand-silver-dark text-sm mt-2 font-medium">{t('auth.secureAuth')}</p>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-brand-silver-dark mb-2 ml-1">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-silver-dark" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-brand-blue transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-sm font-semibold text-brand-silver-dark">{t('auth.password')}</label>
                <button 
                  type="button"
                  onClick={() => setError(t('auth.contactAdmin'))}
                  className="text-xs text-brand-blue hover:underline font-medium"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-silver-dark" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white focus:outline-none focus:border-brand-blue transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-silver-dark hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl py-4 font-bold transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {t('common.login')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )} 
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-brand-silver-dark text-sm">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-brand-blue font-bold hover:underline">
                {t('common.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
