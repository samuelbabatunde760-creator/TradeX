'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LogOut, User, Wallet, Activity, ArrowDownToLine, Loader2 } from 'lucide-react';
import { useLanguage } from '@/app/components/LanguageContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<string>('0.00');

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        router.replace('/login');
        return;
      }
      
      setUser(session.user);
      
      // Initial balance fetch
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', session.user.id)
        .single();
        
      if (mounted && userData) {
        setBalance(Number(userData.balance).toFixed(2));
      } else if (mounted && fetchError && (fetchError.code === 'PGRST116' || fetchError.code === '406')) {
        // Create profile if missing
        await supabase
          .from('users')
          .insert([{ id: session.user.id, email: session.user.email, balance: 0.00 }]);
        setBalance('0.00');
      }

      // Real-time balance updates
      const subscription = supabase
        .channel('user-balance-changes')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'users',
          filter: `id=eq.${session.user.id}`
        }, (payload) => {
          if (mounted) setBalance(Number(payload.new.balance).toFixed(2));
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    checkSession();
    return () => { mounted = false; };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617]">
      <Loader2 className="text-brand-blue animate-spin mb-4" size={40} />
      <div className="text-brand-blue font-mono text-sm tracking-widest uppercase animate-pulse">TradeX Terminal Initializing...</div>
    </div>
  );

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="w-64 glass-panel border-r border-t-0 border-b-0 border-l-0 rounded-none flex-col justify-between hidden md:flex">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-blue border border-brand-blue/30 shadow-inner">
              <User size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white truncate max-w-[140px]">{user.email?.split('@')[0]}</div>
              <div className="text-[10px] text-brand-silver-dark uppercase tracking-widest font-bold">{t('common.secure')} Account</div>
            </div>
          </div>
          
          <nav className="space-y-3">
            <Link 
              href="/dashboard" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 border ${
                isActive('/dashboard') 
                  ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30 shadow-lg shadow-brand-blue/5' 
                  : 'text-brand-silver-dark hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <Activity size={18} /> {t('nav.trading')}
            </Link>
            <Link 
              href="/dashboard/deposit" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 border ${
                isActive('/dashboard/deposit') 
                  ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30 shadow-lg shadow-brand-blue/5' 
                  : 'text-brand-silver-dark hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <ArrowDownToLine size={18} /> {t('nav.deposit')}
            </Link>
            <Link 
              href="/dashboard/wallet" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 border ${
                isActive('/dashboard/wallet') 
                  ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30 shadow-lg shadow-brand-blue/5' 
                  : 'text-brand-silver-dark hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <Wallet size={18} /> {t('nav.wallet') || 'Wallet'}
            </Link>
          </nav>
        </div>
        
        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut size={18} /> {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background/50 relative pb-20 md:pb-0">
        <div className="p-4 md:p-6 h-full flex flex-col">
          {/* Header Dashboard Area */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold">{t('nav.dashboard')}</h2>
            <div className="glass-panel px-4 py-2 md:px-6 md:py-3 rounded-xl flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-brand-silver-dark text-xs md:text-sm uppercase font-bold tracking-tighter">{t('dashboard.balance') || 'Balance'}</span>
              <span className="text-xl md:text-2xl font-mono font-bold text-white">${balance}</span>
            </div>
          </header>
          
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 rounded-none z-50 px-6 py-3 flex justify-between items-center backdrop-blur-xl bg-black/60">
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center gap-1 ${isActive('/dashboard') ? 'text-brand-blue' : 'text-brand-silver-dark'}`}
        >
          <Activity size={20} />
          <span className="text-[10px] font-bold uppercase">{t('nav.trading')}</span>
        </Link>
        <Link 
          href="/dashboard/deposit" 
          className={`flex flex-col items-center gap-1 ${isActive('/dashboard/deposit') ? 'text-brand-blue' : 'text-brand-silver-dark'}`}
        >
          <ArrowDownToLine size={20} />
          <span className="text-[10px] font-bold uppercase">{t('nav.deposit')}</span>
        </Link>
        <Link 
          href="/dashboard/wallet" 
          className={`flex flex-col items-center gap-1 ${isActive('/dashboard/wallet') ? 'text-brand-blue' : 'text-brand-silver-dark'}`}
        >
          <Wallet size={20} />
          <span className="text-[10px] font-bold uppercase">{t('nav.wallet') || 'Wallet'}</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-red-500/70"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-bold uppercase">{t('common.logout')}</span>
        </button>
      </nav>
    </div>
  );
}
