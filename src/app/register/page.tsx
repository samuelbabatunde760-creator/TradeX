'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/app/components/LanguageContext';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRequirements = [
    { label: t('auth.passLen') || 'At least 8 characters', met: password.length >= 8 },
    { label: t('auth.passNum') || 'Contains a number', met: /\d/.test(password) },
    { label: t('auth.passSpec') || 'Special character (@$!%*?)', met: /[@$!%*?&]/.test(password) },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('auth.passMismatch'));
      return;
    }

    if (password.length < 8 || !/\d/.test(password) || !/[@$!%*?&]/.test(password)) {
      setError(t('auth.passReq'));
      return;
    }

    if (!agree) {
      setError(t('auth.agreeReq'));
      return;
    }

    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Create user profile
      if (authData.user) {
        await supabase.from('users').insert([{ id: authData.user.id, email: email, balance: 0.00 }]);
      }
      router.push('/dashboard');
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
            <h1 className="text-3xl font-bold tracking-tight">{t('auth.createAccount')}</h1>
            <p className="text-brand-silver-dark text-sm mt-2 font-medium">{t('auth.secureReg')}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
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
              <label className="block text-sm font-semibold text-brand-silver-dark mb-2 ml-1">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-silver-dark" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
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

            <div>
              <label className="block text-sm font-semibold text-brand-silver-dark mb-2 ml-1">{t('auth.confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-silver-dark" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-brand-blue transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-1">
              <div className="pt-0.5">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-black/40 text-brand-blue focus:ring-brand-blue" 
                />
              </div>
              <label htmlFor="terms" className="text-sm text-brand-silver-dark">
                {t('auth.agree')} <Link href="/terms" className="text-brand-blue hover:underline">{t('auth.terms')}</Link> {t('auth.and')} <Link href="/privacy" className="text-brand-blue hover:underline">{t('auth.privacy')}</Link>
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in zoom-in-95">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl py-4 font-bold transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {t('auth.createAccount')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-brand-silver-dark text-sm">
              {t('auth.hasAccount')} <Link href="/login" className="text-brand-blue font-bold hover:underline">{t('auth.loginNow')}</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
