'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowDownToLine, Loader2, Copy, CheckCircle } from 'lucide-react';

export default function DepositPage() {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [masterWallet, setMasterWallet] = useState<string | null>(null);
  const [masterPasskey, setMasterPasskey] = useState<string>('TRADEX-' + Math.random().toString(36).slice(2, 8).toUpperCase());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);

    // Fetch master wallet setting
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'master_wallet')
      .single();
    
    if (settingsData) setMasterWallet(settingsData.value);

    const { data } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setRequests(data);
  };

  const requestDeposit = async () => {
    if (!masterWallet) {
      alert("Admin hasn't set a master wallet yet. Please try again later or contact support.");
      return;
    }
    
    setLoading(true);
    await supabase.from('deposit_requests').insert([
      { 
        user_id: userId, 
        status: 'approved', 
        wallet_address: masterWallet,
        passkey: masterPasskey
      }
    ]);
    await fetchRequests();
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const confirmPayment = async (requestId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('deposit_requests')
      .update({ status: 'processing' })
      .eq('id', requestId);
    
    if (!error) {
      alert("Payment confirmation sent to admin! Your balance will be updated once verified.");
      fetchRequests();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="glass-panel p-8 rounded-2xl mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <ArrowDownToLine className="text-brand-blue" />
              Deposit Funds
            </h3>
            <p className="text-brand-silver-dark max-w-xl">
              To fund your account, request a secure deposit link. Our team will manually generate a unique wallet address and passkey for your transaction.
            </p>
          </div>
          <button 
            onClick={requestDeposit}
            disabled={loading}
            className="px-6 py-3 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            Request Deposit
          </button>
        </div>
      </div>

      <h4 className="text-xl font-bold mb-4">Your Deposit Requests</h4>
      
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center text-brand-silver-dark">
            You haven't made any deposit requests yet.
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <div className="text-sm text-brand-silver-dark mb-1">
                  Request ID: <span className="font-mono text-white/50">{req.id.split('-')[0]}...</span>
                </div>
                <div className="text-xs text-brand-silver-dark/70">
                  {new Date(req.created_at).toLocaleString()}
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-sm font-bold uppercase tracking-wider animate-pulse">
                    Request Sent to Admin
                  </div>
                  <p className="text-xs text-brand-silver-dark max-w-[200px]">
                    Your request is being reviewed. Once approved, the admin will provide the secure wallet address here.
                  </p>
                </div>
              )}

              {req.status === 'approved' && (
                <div className="flex-1 max-w-xl bg-background/50 border border-brand-blue/30 rounded-xl p-4 ml-0 md:ml-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-green-400 font-medium">
                      <CheckCircle size={16} /> Approved
                    </div>
                    <button 
                      onClick={() => confirmPayment(req.id)}
                      disabled={loading}
                      className="text-[10px] bg-brand-blue/20 hover:bg-brand-blue text-brand-blue hover:text-white px-3 py-1 rounded-full font-bold transition-all border border-brand-blue/30"
                    >
                      I HAVE SENT FUNDS
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-brand-silver-dark block mb-1">Send funds to this Wallet Address:</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black/40 px-3 py-2 rounded text-brand-blue font-mono text-sm break-all">
                          {req.wallet_address}
                        </code>
                        <button onClick={() => copyToClipboard(req.wallet_address)} className="p-2 hover:bg-white/10 rounded transition-colors">
                          <Copy size={16} className="text-brand-silver-dark" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-brand-silver-dark block mb-1">Transaction Passkey:</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black/40 px-3 py-2 rounded text-white font-mono text-sm break-all">
                          {req.passkey}
                        </code>
                        <button onClick={() => copyToClipboard(req.passkey)} className="p-2 hover:bg-white/10 rounded transition-colors">
                          <Copy size={16} className="text-brand-silver-dark" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {req.status === 'processing' && (
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-bold uppercase tracking-wider">
                    Verifying Payment
                  </div>
                  <p className="text-xs text-brand-silver-dark max-w-[200px]">
                    You have confirmed payment. Admin is now verifying the transaction on the blockchain.
                  </p>
                </div>
              )}
              
              {req.status === 'rejected' && (
                <div className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium">
                  Rejected
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
