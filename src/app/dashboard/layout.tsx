'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LogOut, User, Wallet, Activity, ArrowDownToLine } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-background text-brand-blue font-mono">Loading TradeX...</div>;

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-t-0 border-b-0 border-l-0 rounded-none flex flex-col justify-between hidden md:flex">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-blue border border-brand-blue/30 shadow-inner">
              <User size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white truncate max-w-[140px]">{user.email?.split('@')[0]}</div>
              <div className="text-[10px] text-brand-silver-dark uppercase tracking-widest font-bold">Standard Account</div>
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
              <Activity size={18} /> Trade
            </Link>
            <Link 
              href="/dashboard/deposit" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 border ${
                isActive('/dashboard/deposit') 
                  ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30 shadow-lg shadow-brand-blue/5' 
                  : 'text-brand-silver-dark hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <ArrowDownToLine size={18} /> Deposit
            </Link>
            <Link 
              href="/dashboard/wallet" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 border ${
                isActive('/dashboard/wallet') 
                  ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30 shadow-lg shadow-brand-blue/5' 
                  : 'text-brand-silver-dark hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <Wallet size={18} /> Wallet
            </Link>
          </nav>
        </div>
        
        <div className="p-6 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background/50 relative">
        <div className="p-6 h-full flex flex-col">
          {/* Header Dashboard Area */}
          <header className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Trading Dashboard</h2>
            <div className="glass-panel px-6 py-3 rounded-xl flex items-center gap-4">
              <span className="text-brand-silver-dark text-sm">Balance:</span>
              <span className="text-2xl font-mono font-bold text-white">${balance}</span>
            </div>
          </header>
          
          {children}
        </div>
      </main>
    </div>
  );
}
