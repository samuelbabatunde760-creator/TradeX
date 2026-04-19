'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Users, ArrowDownToLine, ArrowUpRight, Settings, Loader2, CheckCircle, XCircle, Activity } from 'lucide-react';

// Hardcoded master password for simplicity as requested
// For production, set the ADMIN_PASSWORD environment variable. 
// The fallback below is your requested password.
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ".Henry@123456..";

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'settings' | 'trades'>('users');
  const [trades, setTrades] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [masterWallet, setMasterWallet] = useState('');

  useEffect(() => {
    // Load master wallet from Supabase
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'master_wallet').single();
    if (data) setMasterWallet(data.value);
  };

  const saveSettings = async () => {
    const { error } = await supabase.from('system_settings').upsert({ key: 'master_wallet', value: masterWallet });
    if (!error) {
      alert("Settings saved to Cloud! This wallet will be used for all deposit approvals.");
    } else {
      alert("Error saving settings: " + error.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Invalid credentials");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: usersData, error: uError } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (uError) throw uError;
      if (usersData) setUsers(usersData);
      
      const { data: reqData, error: rError } = await supabase.from('deposit_requests').select(`
        *,
        users ( email )
      `).order('created_at', { ascending: false });
      if (rError) throw rError;
      if (reqData) setRequests(reqData);

      const { data: withData, error: wError } = await supabase.from('withdraw_requests').select(`
        *,
        users ( email )
      `).order('created_at', { ascending: false });
      if (wError) throw wError;
      if (withData) setWithdraws(withData);

      const { data: tradesData, error: tError } = await supabase.from('trades').select(`
        *,
        users ( email )
      `).order('created_at', { ascending: false });
      if (tError) throw tError;
      if (tradesData) setTrades(tradesData);
      
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || "An unknown error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async (userId: string, currentBalance: number) => {
    const newBalanceStr = prompt("Enter new balance:", currentBalance.toString());
    if (newBalanceStr === null) return;
    
    const newBalance = parseFloat(newBalanceStr);
    if (isNaN(newBalance)) return;
    
    await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
    fetchData();
  };

  const handleDepositRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      const wallet = prompt("Enter Wallet Address for user to deposit to:", masterWallet || "0x" + Math.random().toString(16).slice(2, 42));
      const passkey = prompt("Enter secure passkey:", Math.random().toString(36).slice(2, 10).toUpperCase());
      
      if (!wallet || !passkey) return;
      
      await supabase.from('deposit_requests').update({
        status: 'approved',
        wallet_address: wallet,
        passkey: passkey
      }).eq('id', requestId);
    } else {
      await supabase.from('deposit_requests').update({ status: 'rejected' }).eq('id', requestId);
    }
    fetchData();
  };

  const handleWithdrawRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      if (!confirm("Are you sure you want to approve this withdrawal? Ensure you have sent the funds manually first.")) return;
      await supabase.from('withdraw_requests').update({ status: 'approved' }).eq('id', requestId);
    } else {
      // If rejected, we should ideally refund the user, but for now just mark as rejected
      const refund = confirm("Withdrawal rejected. Should we refund the amount to the user's balance?");
      if (refund) {
        const req = withdraws.find(w => w.id === requestId);
        if (req) {
           const { data: user } = await supabase.from('users').select('balance').eq('id', req.user_id).single();
           if (user) {
             await supabase.from('users').update({ balance: user.balance + req.amount }).eq('id', req.user_id);
           }
        }
      }
      await supabase.from('withdraw_requests').update({ status: 'rejected' }).eq('id', requestId);
    }
    fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-md bg-red-950/20 border border-red-500/30 p-8 rounded-2xl backdrop-blur-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
              <ShieldAlert size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Restricted Access</h1>
          <p className="text-red-400/80 text-center mb-8 text-sm">Admin Portal. Unauthorized access is logged.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-black/50 border border-red-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              placeholder="Master Password"
            />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 font-bold transition-colors">
              Access System
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center border border-red-500/30">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tighter">Trade<span className="text-red-500">X</span> Admin</h1>
              <p className="text-brand-silver-dark text-xs font-mono uppercase">Master Protocol Active</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} className="p-2 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-xs font-bold uppercase">
              Refresh Data
            </button>
            <button onClick={() => setIsAuthenticated(false)} className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 text-xs font-bold transition-all uppercase tracking-widest">
              Logout
            </button>
          </div>
        </header>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border ${activeTab === 'users' ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <Users size={18} /> USERS
          </button>
          <button 
            onClick={() => setActiveTab('deposits')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border ${activeTab === 'deposits' ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <ArrowDownToLine size={18} /> DEPOSITS
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border ${activeTab === 'withdrawals' ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <ArrowUpRight size={18} className="rotate-45" /> WITHDRAWALS
            {withdraws.filter(w => w.status === 'pending').length > 0 && (
              <span className="ml-2 w-5 h-5 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {withdraws.filter(w => w.status === 'pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('trades')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border ${activeTab === 'trades' ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-600/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <Activity size={18} /> TRADES
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border ${activeTab === 'settings' ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <Settings size={18} /> SETTINGS
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-8 flex items-center gap-3 text-red-400">
            <XCircle size={20} />
            <div>
              <p className="font-bold">Database Error</p>
              <p className="text-sm opacity-80">{error}. Check if RLS is enabled in Supabase without proper policies.</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-blue" size={32} /></div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
            
            {activeTab === 'users' && (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-brand-silver-dark text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 font-bold">Account Email</th>
                    <th className="p-4 font-bold">Registered Date</th>
                    <th className="p-4 font-bold text-right">Balance</th>
                    <th className="p-4 font-bold text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-brand-silver-dark">No users found. Ensure they have logged into the dashboard at least once.</td></tr>
                  )}
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{u.email}</div>
                        <div className="text-[9px] font-mono text-brand-silver-dark opacity-50 uppercase tracking-tighter">{u.id}</div>
                      </td>
                      <td className="p-4 text-xs text-brand-silver-dark">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right font-mono font-bold text-green-400">${Number(u.balance).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => updateBalance(u.id, u.balance)}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold transition-colors uppercase"
                        >
                          Manual Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'deposits' && (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-brand-silver-dark text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 font-bold">Timestamp</th>
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">State</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map(r => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-xs text-brand-silver-dark">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="p-4 font-medium text-sm">{r.users?.email || 'Unknown'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                          r.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                          r.status === 'processing' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse' :
                          r.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                          'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        {(r.status === 'pending' || r.status === 'processing') && (
                          <>
                            <button 
                              onClick={() => handleDepositRequest(r.id, 'approved')}
                              className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded flex items-center gap-1 text-[10px] font-bold uppercase"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleDepositRequest(r.id, 'rejected')}
                              className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded flex items-center gap-1 text-[10px] font-bold uppercase"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'trades' && (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-brand-silver-dark text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">Asset/Dir</th>
                    <th className="p-4 font-bold">Amount</th>
                    <th className="p-4 font-bold text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trades.map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm font-medium">{t.users?.email || 'Unknown'}</td>
                      <td className="p-4">
                        <div className="font-bold text-xs uppercase">{t.asset}</div>
                        <div className={`text-[9px] font-bold uppercase ${t.direction === 'call' ? 'text-green-400' : 'text-red-400'}`}>{t.direction}</div>
                      </td>
                      <td className="p-4 font-mono text-sm">${t.amount}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                          t.result === 'win' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                          t.result === 'loss' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                          'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                        }`}>
                          {t.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'withdrawals' && (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-brand-silver-dark text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 font-bold">Timestamp</th>
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">Wallet Address</th>
                    <th className="p-4 font-bold text-right">Amount</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdraws.map(w => (
                    <tr key={w.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-xs text-brand-silver-dark">{new Date(w.created_at).toLocaleString()}</td>
                      <td className="p-4 font-medium text-sm">{w.users?.email || 'Unknown'}</td>
                      <td className="p-4 font-mono text-[10px] text-brand-blue truncate max-w-[150px]">{w.wallet_address}</td>
                      <td className="p-4 text-right font-mono font-bold text-white">${w.amount}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        {w.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleWithdrawRequest(w.id, 'approved')}
                              className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded flex items-center gap-1 text-[10px] font-bold uppercase"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleWithdrawRequest(w.id, 'rejected')}
                              className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded flex items-center gap-1 text-[10px] font-bold uppercase"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {w.status !== 'pending' && (
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                            w.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                            'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}>
                            {w.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {withdraws.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-brand-silver-dark">No withdrawal requests found.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'settings' && (
              <div className="p-8 max-w-2xl mx-auto space-y-8">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold mb-1">System Configurations</h2>
                  <p className="text-brand-silver-dark text-sm">Manage global settings for the TradeX protocol.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-brand-silver-dark uppercase tracking-widest mb-2">Company Master Wallet (for Deposits)</label>
                    <input 
                      type="text" 
                      value={masterWallet}
                      onChange={(e) => setMasterWallet(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-white font-mono focus:outline-none focus:border-purple-500 transition-all"
                    />
                    <p className="mt-2 text-[10px] text-brand-silver-dark">This wallet address will be pre-filled when you approve deposit requests.</p>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={saveSettings}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-600/20"
                    >
                      SAVE SETTINGS
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                  <p className="text-xs text-yellow-500 font-bold uppercase mb-2">Notice:</p>
                  <p className="text-[11px] text-yellow-500/80 leading-relaxed">
                    Settings are now saved globally in the 'system_settings' table. All administrators will see the same configuration.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
