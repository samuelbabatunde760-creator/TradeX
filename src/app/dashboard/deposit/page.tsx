'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowDownToLine, Loader2, CheckCircle, ShieldCheck, Key, HelpCircle } from 'lucide-react';

export default function DepositPage() {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);

    const { data } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setRequests(data);
  };

  const handleSubmitPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Validate passkey
    const { data: keyData, error: keyError } = await supabase
      .from('secure_passkeys')
      .select('*')
      .eq('key', passkey.trim())
      .eq('is_used', false)
      .single();

    if (keyError || !keyData) {
      setError("Invalid or already used passkey. Please contact your admin for a new secured passkey.");
      setLoading(false);
      return;
    }

    // 2. Mark passkey as used
    const { error: updateError } = await supabase
      .from('secure_passkeys')
      .update({ is_used: true, used_by: userId })
      .eq('id', keyData.id);

    if (updateError) {
      setError("Error processing passkey. Please try again.");
      setLoading(false);
      return;
    }

    // 3. Create deposit request
    const { error: depositError } = await supabase.from('deposit_requests').insert([
      { 
        user_id: userId, 
        status: 'processing', 
        passkey: passkey.trim(),
        wallet_address: 'ADMIN_GENERATED'
      }
    ]);

    if (depositError) {
      console.error("Deposit error:", depositError);
    }

    setSuccess(true);
    setPasskey('');
    fetchRequests();
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      <div className="glass-panel p-8 rounded-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldCheck size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center">
              <ArrowDownToLine size={24} />
            </div>
            <h3 className="text-2xl font-bold">Secure Deposit</h3>
          </div>
          
          <p className="text-brand-silver-dark mb-8 max-w-2xl leading-relaxed">
            To ensure the highest level of security, all deposits must be authorized through a secure passkey protocol. 
            <span className="text-white font-medium block mt-2">Contact your account administrator to receive your unique transaction passkey.</span>
          </p>

          {success ? (
            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Passkey Verified Successfully!</h4>
              <p className="text-brand-silver-dark text-sm mb-4">Your deposit is now being processed. Please wait while the administrator updates your balance.</p>
              <button 
                onClick={() => setSuccess(false)}
                className="text-brand-blue hover:underline text-sm font-medium"
              >
                Submit another passkey
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitPasskey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-silver-dark mb-2 flex items-center gap-2">
                  <Key size={14} /> Enter Secured Passkey
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    required
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                    placeholder="TX-XXXX-XXXX"
                    className="flex-1 bg-background/50 border border-white/10 rounded-xl px-4 py-4 text-white font-mono tracking-widest focus:outline-none focus:border-brand-blue transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={loading || !passkey}
                    className="px-8 py-4 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 min-w-[200px]"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'COMPLETE DEPOSIT'}
                  </button>
                </div>
              </div>
              
              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  {error}
                </p>
              )}

              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                <HelpCircle className="text-brand-silver-dark shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-brand-silver-dark leading-relaxed">
                  Don't have a passkey? Please reach out to your personal account manager or the TradeX support desk via the contact details provided in your welcome packet.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold">Transaction History</h4>
        <div className="text-xs text-brand-silver-dark font-mono uppercase tracking-widest">Protocol V4.2</div>
      </div>
      
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
              <ArrowDownToLine size={32} />
            </div>
            <p className="text-brand-silver-dark">No transaction records found.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-white/20 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  req.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                  req.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    {req.status === 'processing' ? 'Deposit Processing' : 'Deposit Complete'}
                    <span className="text-[10px] font-mono text-brand-silver-dark px-1.5 py-0.5 bg-white/5 rounded tracking-tighter">
                      {req.passkey}
                    </span>
                  </div>
                  <div className="text-[10px] text-brand-silver-dark mt-1 font-mono">
                    REF: {req.id.split('-')[0].toUpperCase()} • {new Date(req.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                  req.status === 'processing' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse' :
                  req.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                  'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {req.status === 'processing' ? 'Waiting for Admin' : req.status}
                </span>
                {req.status === 'processing' && (
                  <p className="text-[9px] text-brand-silver-dark font-medium italic">Balance update pending...</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
