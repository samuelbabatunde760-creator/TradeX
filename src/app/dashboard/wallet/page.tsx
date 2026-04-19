'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, History, CreditCard, Loader2 } from 'lucide-react';

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [trades, setTrades] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);
  
  // Withdrawal Modal State
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawWallet, setWithdrawWallet] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Fetch balance
      const { data: userData } = await supabase
        .from('users')
        .select('balance')
        .eq('id', session.user.id)
        .single();
      
      if (userData) setBalance(userData.balance);

      // 2. Fetch trades
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (tradesData) setTrades(tradesData);

      // 3. Fetch deposits
      const { data: depositsData } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (depositsData) setDeposits(depositsData);

      // 4. Fetch withdrawals
      const { data: withdrawsData } = await supabase
        .from('withdraw_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (withdrawsData) setWithdraws(withdrawsData);
    } catch (err) {
      console.error("Wallet Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage('Error: Invalid amount');
      return;
    }
    
    if (amountNum > balance) {
      setMessage('Error: Insufficient balance');
      return;
    }
    
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('withdraw_requests').insert([{
      user_id: session.user.id,
      amount: amountNum,
      wallet_address: withdrawWallet,
      status: 'pending'
    }]);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Request Sent: Admin will review and approve shortly.');
      setTimeout(() => {
        setShowWithdraw(false);
        setMessage('');
        fetchWalletData();
      }, 3000);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 pb-12">
      {/* Wallet Header Card */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-brand-blue/10 to-transparent border-brand-blue/20">
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-brand-silver-dark mb-4">
              <Wallet size={20} className="text-brand-blue" />
              <span className="font-medium tracking-wide">TOTAL BALANCE</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-mono text-white">${balance.toFixed(2)}</span>
              <span className="text-brand-silver-dark font-medium">USD</span>
            </div>
            
            <div className="mt-12 flex gap-4">
              <Link href="/dashboard/deposit" className="flex-1 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl py-4 font-bold transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2">
                <ArrowDownLeft size={18} /> DEPOSIT
              </Link>
              <button 
                onClick={() => setShowWithdraw(true)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2"
              >
                <ArrowUpRight size={18} /> WITHDRAW
              </button>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-brand-blue/10 blur-[100px] rounded-full" />
        </div>

        <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="text-brand-silver-dark text-sm font-medium mb-1 text-center">Live Statistics</div>
            <div className="h-24 flex items-end gap-1.5 px-1 mt-4">
               {[30, 50, 40, 60, 45, 70, 65].map((h, i) => (
                 <div key={i} className="flex-1 bg-brand-blue/20 rounded-t-sm" style={{ height: `${h}%` }}></div>
               ))}
            </div>
          </div>
          <div className="text-xs text-brand-silver-dark/60 mt-4 text-center">Market activity updated 2 mins ago</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Trades */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-xl font-bold flex items-center gap-2">
              <History size={20} className="text-brand-blue" /> Trade Activity
            </h4>
            <button className="text-sm text-brand-blue hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {trades.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center text-brand-silver-dark">No recent trades found.</div>
            ) : (
              trades.map((trade) => (
                <div key={trade.id} className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${trade.direction === 'call' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {trade.direction === 'call' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    <div>
                      <div className="font-bold">{trade.asset}</div>
                      <div className="text-xs text-brand-silver-dark">{new Date(trade.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">${trade.amount}</div>
                    <div className={`text-xs font-bold uppercase ${trade.result === 'win' ? 'text-green-400' : trade.result === 'loss' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {trade.result}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Combined Wallet History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-xl font-bold flex items-center gap-2">
              <CreditCard size={20} className="text-brand-blue" /> Request History
            </h4>
          </div>
          <div className="space-y-3">
            {[...deposits.map(d => ({...d, type: 'deposit'})), ...withdraws.map(w => ({...w, type: 'withdraw'}))]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((req, i) => (
                <div key={i} className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${req.type === 'deposit' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {req.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm uppercase">{req.type} REQUEST</div>
                      <div className="text-xs text-brand-silver-dark">{new Date(req.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm mb-1">{req.amount ? `$${req.amount}` : '-'}</div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                      req.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                      req.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                      'bg-red-500/10 border-red-500/30 text-red-500'
                    }`}>
                      {req.status}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </section>
      </div>

      {/* Withdrawal Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden bg-background shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue to-purple-500" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <ArrowUpRight className="text-brand-blue" /> Withdraw
                </h3>
                <p className="text-brand-silver-dark text-sm">Transfer funds to your crypto wallet.</p>
              </div>
              <button onClick={() => setShowWithdraw(false)} className="text-brand-silver-dark hover:text-white transition-colors">✕</button>
            </div>

            {message && (
              <div className={`p-4 mb-6 rounded-xl text-sm font-medium border ${message.startsWith('Error') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-brand-silver-dark uppercase tracking-widest mb-2">Withdrawal Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-silver-dark font-mono">$</span>
                  <input 
                    type="number" 
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-8 pr-4 text-white focus:outline-none focus:border-brand-blue transition-all font-mono"
                    placeholder="0.00"
                  />
                  <button 
                    type="button" 
                    onClick={() => setWithdrawAmount(balance.toFixed(2))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-blue hover:text-white uppercase transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-silver-dark uppercase tracking-widest mb-2">Recipient Wallet Address</label>
                <input 
                  type="text" 
                  required
                  value={withdrawWallet}
                  onChange={(e) => setWithdrawWallet(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-blue transition-all font-mono text-sm"
                  placeholder="0x..."
                />
              </div>

              <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-brand-silver-dark">Processing Fee</span>
                  <span className="text-white font-mono">2.5%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-silver-dark">You will receive</span>
                  <span className="text-green-400 font-bold font-mono">${(parseFloat(withdrawAmount || '0') * 0.975).toFixed(2)}</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl py-4 font-bold transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'CONFIRM WITHDRAWAL'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
