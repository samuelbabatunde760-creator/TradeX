'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, MessageCircle, ShieldCheck, CheckCircle2, XCircle, Key, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/app/components/LanguageContext';

export default function DepositPage() {
  const { t } = useLanguage();
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [passkey, setPasskey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchRecentRequests();
  }, []);

  const fetchRecentRequests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('deposit_requests')
      .select('id, status, created_at, method')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setRecentRequests(data);
  };

  const submitPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({type: 'error', text: 'Please log in first.'});
        return;
      }

      // Check if passkey exists and is not used
      const normalizedKey = passkey.trim().toUpperCase();
      const { data: keyData, error: keyError } = await supabase
        .from('secure_passkeys')
        .select('*')
        .eq('key', normalizedKey)
        .eq('is_used', false)
        .single();

      if (keyError || !keyData) {
        setMessage({type: 'error', text: 'Invalid or already used passkey. Please contact admin for a new one.'});
        return;
      }

      // Create deposit request with passkey
      const { error: reqError } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: session.user.id,
          status: 'pending'
        });

      if (reqError) {
        setMessage({type: 'error', text: `Failed to submit request: ${reqError.message}`});
        console.error('Deposit request error:', reqError);
        return;
      }

      // Mark passkey as used with timestamp
      await supabase
        .from('secure_passkeys')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', keyData.id);

      setMessage({type: 'success', text: 'Passkey submitted successfully! Waiting for admin approval.'});
      setPasskey('');
      fetchRecentRequests();

    } catch (err) {
      setMessage({type: 'error', text: 'An error occurred. Please try again.'});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Deposit with Passkey</h1>
        <p className="text-brand-silver-dark max-w-lg mx-auto">
          Use the secure passkey given by admin. Submit it here to create a deposit request for approval.
        </p>
      </div>

      {/* Passkey Form */}
      <div className="glass-panel p-8 rounded-3xl border-white/10 shadow-2xl max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Key size={32} className="text-purple-500" />
          </div>
          <h2 className="text-xl font-bold">Enter Your Deposit Passkey</h2>
          <p className="text-brand-silver-dark text-sm mt-1">
            Submit the secure passkey you received from admin. Once approved, your account balance will be credited immediately.
          </p>
        </div>

        <form onSubmit={submitPasskey} className="space-y-4">
          <input
            type="text"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value.toUpperCase().replace(/\s+/g, ''))}
            className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white font-mono text-center text-lg tracking-wider focus:outline-none focus:border-purple-500 placeholder:text-white/30"
            placeholder="TX-XXXX-XXXX"
            disabled={submitting}
          />

          <button
            type="submit"
            disabled={submitting || !passkey.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg py-3 font-bold transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Submit Passkey
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Admin Panel */}
        <div className="glass-panel p-8 rounded-3xl border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={80} className="text-brand-blue" />
          </div>

          <div className="flex flex-col items-center justify-center text-center h-full gap-6 py-6">
            <div className="w-20 h-20 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <MessageCircle size={36} className="text-brand-blue" />
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">How to Deposit</h2>
              <p className="text-brand-silver-dark text-sm leading-relaxed">
                Submit the passkey provided by admin. The admin will verify it, then approve and credit your balance.
              </p>
            </div>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
              {[
                '1. Ask admin for a valid deposit passkey.',
                '2. Paste the passkey into the form above and submit.',
                '3. Wait for admin approval before your balance is updated.',
                '4. After approval, the credited amount appears in your wallet balance.',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-brand-silver-dark">
                  <CheckCircle2 size={15} className="text-brand-blue shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="w-full p-4 bg-brand-blue/5 border border-brand-blue/20 rounded-2xl text-sm text-brand-silver-dark text-center">
              ⏱ Deposits are approved manually by admin. Once approved, your balance updates instantly.
            </div>
          </div>
        </div>

        {/* Recent Requests History */}
        <div className="glass-panel p-8 rounded-3xl border-white/10">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-brand-silver-dark" />
            Recent Deposit Requests
          </h2>
          <div className="space-y-4">
            {recentRequests.map((req) => (
              <div key={req.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-brand-silver-dark uppercase tracking-wider">
                    Status
                  </div>
                  <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
                    req.status === 'approved' ? 'text-green-400' :
                    req.status === 'rejected' ? 'text-red-400' :
                    'text-yellow-500'
                  }`}>
                    {req.status === 'approved' ? <CheckCircle2 size={13} /> :
                     req.status === 'rejected' ? <XCircle size={13} /> : null}
                    {req.status === 'pending'
                      ? 'Waiting for Admin'
                      : req.status === 'approved'
                      ? 'Approved ✓'
                      : 'Rejected ✗'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-brand-silver-dark">
                    {new Date(req.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-[10px] font-mono text-brand-silver-dark/60 mt-1 truncate max-w-[120px]">
                    Passkey
                  </div>
                </div>
              </div>
            ))}

            {recentRequests.length === 0 && (
              <div className="text-center py-12 text-brand-silver-dark/40 border-2 border-dashed border-white/5 rounded-2xl">
                No deposit requests yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
