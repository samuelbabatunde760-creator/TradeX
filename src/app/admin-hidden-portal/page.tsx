'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Users, ArrowDownToLine, ArrowUpRight, Settings, Loader2, CheckCircle, XCircle, Activity, Clock } from 'lucide-react';

// Admin password is required - must be set in environment variables
// NEVER hardcode passwords in source code
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [withdraws, setWithdraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'settings' | 'trades' | 'passkeys' | 'history'>('users');
  const [trades, setTrades] = useState<any[]>([]);
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
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
      
      const { data: reqData, error: rError } = await supabase
        .from('deposit_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (rError) console.error('deposit_requests fetch error:', rError);
      if (reqData) setRequests(reqData);

      const { data: withData, error: wError } = await supabase
        .from('withdraw_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (wError) console.error('withdraw_requests fetch error:', wError);
      if (withData) setWithdraws(withData);

      const { data: tradesData, error: tError } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });
      if (tError) console.error('trades fetch error:', tError);
      if (tradesData) setTrades(tradesData);

      const { data: passData, error: pError } = await supabase.from('secure_passkeys').select('*').order('created_at', { ascending: false });
      if (!pError && passData) setPasskeys(passData);

      const { data: histData, error: hError } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (!hError && histData) setHistory(histData);
      
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || "An unknown error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const generatePasskeys = async () => {
    setLoading(true);
    const newKeys = Array.from({ length: 20 }, () => ({
      key: 'TX-' + Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
    }));

    const { error } = await supabase.from('secure_passkeys').insert(newKeys);
    if (error) {
      alert("Error generating keys. Make sure the 'secure_passkeys' table exists. Error: " + error.message);
    } else {
      alert("20 Secure Passkeys generated successfully!");
      fetchData();
    }
    setLoading(false);
  };

  const updateBalance = async (userId: string, currentBalance: number) => {
    const newBalanceStr = prompt("Enter new balance:", currentBalance.toString());
    if (newBalanceStr === null) return;
    
    const newBalance = parseFloat(newBalanceStr);
    if (isNaN(newBalance)) return;
    
    await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
    fetchData();
  };

  const updateUserPassword = async (userId: string, email: string) => {
    const newPassword = prompt(`Enter new password for ${email}:`);
    if (!newPassword || newPassword.length < 6) {
      if (newPassword) alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/update-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Password updated successfully!");
      } else {
        alert("Error: " + result.error);
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    if (action === 'approved') {
      const amountStr = prompt('Enter the deposit amount to credit (USD):');
      if (amountStr === null) return;
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) { alert('Invalid amount.'); return; }

      // Check if this is a passkey request
      const isPasskeyRequest = req.method && req.method.startsWith('Passkey: ');
      let passkey = null;
      if (isPasskeyRequest) {
        passkey = req.method.replace('Passkey: ', '');
        // Verify passkey exists and is not used
        const { data: keyData } = await supabase
          .from('secure_passkeys')
          .select('*')
          .eq('key', passkey)
          .eq('is_used', false)
          .single();
        if (!keyData) {
          alert('Invalid passkey or already used.');
          return;
        }
      }

      // 1. Mark deposit request as approved
      const { error: upErr } = await supabase
        .from('deposit_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);
      if (upErr) { alert('Error updating request: ' + upErr.message); return; }

      // 2. If passkey, mark as used
      if (passkey) {
        const { error: keyErr } = await supabase
          .from('secure_passkeys')
          .update({ is_used: true })
          .eq('key', passkey);
        if (keyErr) {
          console.error('Error marking passkey as used:', keyErr);
          // Don't fail the whole operation
        }
      }

      // 3. Credit user balance
      const { data: userData, error: uErr } = await supabase
        .from('users').select('balance').eq('id', req.user_id).single();
      if (uErr || !userData) {
        alert('\u2705 Request approved but could not read user balance. Update manually.');
      } else {
        const { error: balErr } = await supabase
          .from('users')
          .update({ balance: Number(userData.balance) + amount })
          .eq('id', req.user_id);
        if (balErr) alert('Balance update failed: ' + balErr.message);
        else alert(`\u2705 $${amount} approved and credited to user!${isPasskeyRequest ? ' Passkey marked as used.' : ''}`);
      }

      // 4. Log admin action (optional, for history)
      // You could add to an admin_actions table here if needed

    } else {
      const { error: rejErr } = await supabase
        .from('deposit_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      if (rejErr) { alert('Error: ' + rejErr.message); return; }
      alert('\u274c Deposit rejected.');
    }
    fetchData();
  };

  const handleWithdrawRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      if (!confirm("Approve this withdrawal? The amount has already been deducted from the user's balance. Ensure you send the funds manually.")) return;
      await supabase.from('withdraw_requests').update({ status: 'approved', approved_at: new Date() }).eq('id', requestId);
    } else {
      // Rejection: Refund the amount to user's balance
      const refund = confirm("Reject this withdrawal? The amount will be refunded to the user's balance.");
      if (refund) {
        const req = withdraws.find(w => w.id === requestId);
        if (req) {
           const { data: user } = await supabase.from('users').select('balance').eq('id', req.user_id).single();
           if (user) {
             await supabase.from('users').update({ balance: user.balance + req.amount }).eq('id', req.user_id);
           }
        }
      }
      await supabase.from('withdraw_requests').update({ status: 'rejected', rejected_at: new Date() }).eq('id', requestId);
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
    <div className="min-h-screen bg-[#020617] text-white p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 pb-4 md:pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center border border-red-500/30">
              <ShieldAlert size={20} className="md:block" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold uppercase tracking-tighter">Trade<span className="text-red-500">X</span> Admin</h1>
              <p className="text-brand-silver-dark text-xs font-mono uppercase">Master Protocol Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
            <button onClick={fetchData} className="flex-1 sm:flex-none p-2 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-xs font-bold uppercase">
              Refresh
            </button>
            <button onClick={() => setIsAuthenticated(false)} className="flex-1 sm:flex-none px-3 md:px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 text-xs font-bold transition-all uppercase tracking-widest">
              Logout
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold flex items-center gap-1 md:gap-2 transition-all border whitespace-nowrap text-xs md:text-sm ${activeTab === 'users' ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <Users size={16} className="md:block" /> USERS
          </button>
          <button 
            onClick={() => setActiveTab('deposits')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold flex items-center gap-1 md:gap-2 transition-all border whitespace-nowrap text-xs md:text-sm ${activeTab === 'deposits' ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <ArrowDownToLine size={16} className="md:block" /> DEPOSITS
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[8px] md:text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('passkeys')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold flex items-center gap-1 md:gap-2 transition-all border whitespace-nowrap text-xs md:text-sm ${activeTab === 'passkeys' ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <CheckCircle size={16} className="md:block" /> PASSKEYS
          </button>
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold flex items-center gap-1 md:gap-2 transition-all border whitespace-nowrap text-xs md:text-sm ${activeTab === 'withdrawals' ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <ArrowUpRight size={16} className="md:block rotate-45" /> WITHDRAWALS
            {withdraws.filter(w => w.status === 'pending').length > 0 && (
              <span className="ml-1 w-4 h-4 md:w-5 md:h-5 bg-orange-500 text-white text-[8px] md:text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {withdraws.filter(w => w.status === 'pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('trades')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold flex items-center gap-1 md:gap-2 transition-all border whitespace-nowrap text-xs md:text-sm ${activeTab === 'trades' ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-600/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <Activity size={16} className="md:block" /> TRADES
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold flex items-center gap-1 md:gap-2 transition-all border whitespace-nowrap text-xs md:text-sm ${activeTab === 'history' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <Clock size={16} className="md:block" /> HISTORY
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-bold flex items-center gap-1 md:gap-2 transition-all border whitespace-nowrap text-xs md:text-sm ${activeTab === 'settings' ? 'bg-slate-600 text-white border-slate-600 shadow-lg shadow-slate-600/20' : 'bg-white/5 text-brand-silver-dark border-transparent hover:bg-white/10'}`}
          >
            <Settings size={16} className="md:block" /> SETTINGS
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-8 flex items-center gap-3 text-red-400">
            <XCircle size={20} />
            <div>
              <p className="font-bold">Database Error</p>
              <p className="text-sm opacity-80">{error}. Check if 'secure_passkeys' table exists.</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-blue" size={32} /></div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
            
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-white/5 text-brand-silver-dark text-[8px] md:text-[10px] uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="p-2 md:p-4 font-bold">Account Email</th>
                      <th className="p-2 md:p-4 font-bold">Registered Date</th>
                      <th className="p-2 md:p-4 font-bold text-right">Balance</th>
                      <th className="p-2 md:p-4 font-bold text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.length === 0 && (
                      <tr><td colSpan={4} className="p-4 md:p-8 text-center text-brand-silver-dark">No users found.</td></tr>
                    )}
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-2 md:p-4">
                          <div className="font-medium text-xs md:text-sm">{u.email}</div>
                          <div className="text-[7px] md:text-[9px] font-mono text-brand-silver-dark opacity-50 uppercase tracking-tighter">{u.id?.slice(0,6)}</div>
                        </td>
                        <td className="p-2 md:p-4 text-xs md:text-sm text-brand-silver-dark">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-2 md:p-4 text-right font-mono font-bold text-green-400 text-xs md:text-sm">${Number(u.balance).toFixed(2)}</td>
                        <td className="p-2 md:p-4 text-right">
                          <div className="flex justify-end gap-1 md:gap-2 flex-wrap">
                            <button 
                              onClick={() => updateBalance(u.id, u.balance)}
                              className="px-2 py-1 md:px-3 md:py-1 bg-white/10 hover:bg-white/20 rounded text-[7px] md:text-[10px] font-bold transition-colors uppercase whitespace-nowrap"
                            >
                              Adjust
                            </button>
                            <button 
                              onClick={() => updateUserPassword(u.id, u.email)}
                              className="px-2 py-1 md:px-3 md:py-1 bg-brand-blue/20 hover:bg-brand-blue/30 text-brand-blue rounded text-[7px] md:text-[10px] font-bold transition-colors uppercase whitespace-nowrap"
                            >
                              Pwd Reset
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'passkeys' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Secure Deposit Passkeys</h2>
                    <p className="text-brand-silver-dark text-sm">Manage keys that users must use to complete deposits.</p>
                  </div>
                  <button 
                    onClick={generatePasskeys}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
                  >
                    <CheckCircle size={18} /> GENERATE 20 KEYS
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-2">
                  {passkeys.length === 0 && <div className="col-span-full p-12 text-center text-brand-silver-dark bg-white/5 rounded-2xl">No passkeys generated yet. Click the button above to create 20 keys.</div>}
                  {passkeys.map(pk => (
                    <div key={pk.id} className={`p-4 rounded-xl border ${pk.is_used ? 'bg-red-500/5 border-red-500/20 opacity-60' : 'bg-green-500/5 border-green-500/20'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <code className="text-sm font-bold font-mono text-white tracking-wider">{pk.key}</code>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${pk.is_used ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {pk.is_used ? 'Used' : 'Available'}
                        </span>
                      </div>
                      <div className="text-[9px] text-brand-silver-dark font-mono truncate">
                        ID: {pk.id}
                      </div>
                      {pk.is_used && (
                        <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-red-400">
                          Used at: {pk.used_at ? new Date(pk.used_at).toLocaleString() : 'N/A'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'deposits' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm min-w-[600px]">
                  <thead className="bg-white/5 text-brand-silver-dark text-[8px] md:text-[10px] uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="p-2 md:p-4 font-bold">Timestamp</th>
                      <th className="p-2 md:p-4 font-bold">User</th>
                      <th className="p-2 md:p-4 font-bold">Amount</th>
                      <th className="p-2 md:p-4 font-bold">Method</th>
                      <th className="p-2 md:p-4 font-bold">Status</th>
                      <th className="p-2 md:p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {requests.length === 0 && (
                      <tr><td colSpan={6} className="p-4 md:p-8 text-center text-brand-silver-dark">No deposit requests found.</td></tr>
                    )}
                    {requests.map(r => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-2 md:p-4 text-[7px] md:text-xs text-brand-silver-dark">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2 md:p-4 font-medium text-[8px] md:text-sm">{users.find(u => u.id === r.user_id)?.email?.split('@')[0] || 'N/A'}</td>
                        <td className="p-2 md:p-4 font-mono font-bold text-green-400 text-[8px] md:text-sm">
                          {r.status === 'approved' ? 'Approved ✓' : r.status === 'pending' ? 'Pending' : r.status}
                        </td>
                        <td className="p-2 md:p-4 font-mono text-[7px] md:text-[10px] text-brand-silver-dark">Passkey</td>
                        <td className="p-2 md:p-4 text-[8px] md:text-sm">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                            r.status === 'approved' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                            r.status === 'pending' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
                            'bg-red-500/10 border border-red-500/20 text-red-400'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-2 md:p-4 text-right">
                          <div className="flex justify-end gap-1 md:gap-2 flex-wrap">
                            {(!r.status || r.status.toLowerCase() === 'pending') && (
                              <>
                                <button 
                                  onClick={() => handleDepositRequest(r.id, 'approved')}
                                  className="px-1.5 md:px-3 py-0.5 md:py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded flex items-center gap-0.5 text-[7px] md:text-[10px] font-bold uppercase whitespace-nowrap"
                                >
                                  <CheckCircle size={10} className="md:block" /> Approve
                                </button>
                                <button 
                                  onClick={() => handleDepositRequest(r.id, 'rejected')}
                                  className="px-1.5 md:px-3 py-0.5 md:py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded flex items-center gap-0.5 text-[7px] md:text-[10px] font-bold uppercase whitespace-nowrap"
                                >
                                  <XCircle size={10} className="md:block" /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {(!r.status || r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'processing') && (
                            <>
                              <button 
                                onClick={() => handleDepositRequest(r.id, 'approved')}
                                className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                              >
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button 
                                onClick={() => handleDepositRequest(r.id, 'rejected')}
                                className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                        </div>
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
                      <td className="p-4 text-sm font-medium">{users.find(u => u.id === t.user_id)?.email || t.user_id?.slice(0,8) + '...'}</td>
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
                      <td className="p-4 font-medium text-sm">{users.find(u => u.id === w.user_id)?.email || w.user_id?.slice(0,8) + '...'}</td>
                      <td className="p-4 font-mono text-[10px] text-brand-blue truncate max-w-[150px]">{w.wallet_address}</td>
                      <td className="p-4 text-right font-mono font-bold text-white">${w.amount}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {(!w.status || w.status.toLowerCase() === 'pending') ? (
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
                          ) : (
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                              w.status.toLowerCase() === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                              'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                              {w.status}
                            </span>
                          )}
                          <button 
                            onClick={async () => {
                              if(confirm('Delete this request?')) {
                                await supabase.from('withdraw_requests').delete().eq('id', w.id);
                                fetchData();
                              }
                            }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-brand-silver-dark rounded text-[10px] transition-all"
                          >
                            ✕
                          </button>
                        </div>
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
                      className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-600/20"
                    >
                      SAVE SETTINGS
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                  <p className="text-xs text-yellow-500 font-bold uppercase mb-2">Notice:</p>
                  <p className="text-[11px] text-yellow-500/80 leading-relaxed">
                    Settings are now saved globally in the 'system_settings' table.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-brand-silver-dark text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 font-bold">Approved At</th>
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">Amount Credited</th>
                    <th className="p-4 font-bold">Method / Passkey</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-brand-silver-dark">No approved deposits yet.</td></tr>
                  )}
                  {history.map(h => (
                    <tr key={h.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-xs text-brand-silver-dark">{new Date(h.updated_at || h.created_at).toLocaleString()}</td>
                      <td className="p-4 font-medium text-sm">{users.find(u => u.id === h.user_id)?.email || h.user_id?.slice(0,8) + '...'}</td>
                      <td className="p-4 font-mono font-bold text-green-400">${Number(h.amount).toFixed(2)}</td>
                      <td className="p-4 font-mono text-[10px] text-brand-silver-dark max-w-[200px] truncate">{h.method || 'Manual'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
