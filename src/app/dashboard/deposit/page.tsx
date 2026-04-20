'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, CheckCircle2, Loader2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/app/components/LanguageContext';

export default function DepositPage() {
  const { t } = useLanguage();
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentRequests();
  }, []);

  const fetchRecentRequests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setRecentRequests(data);
  };

  const handleSubmitPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // 1. Verify Passkey
      const { data: keyData, error: keyError } = await supabase
        .from('secure_passkeys')
        .select('*')
        .eq('key', passkey.trim())
        .eq('is_used', false)
        .single();

      if (keyError || !keyData) {
        throw new Error(t('deposit.invalidKey'));
      }

      // 2. Mark passkey as used
      await supabase
        .from('secure_passkeys')
        .update({ is_used: true, used_by: session.user.id })
        .eq('id', keyData.id);

      // 3. Create a deposit request record for admin visibility
      await supabase.from('deposit_requests').insert({
        user_id: session.user.id,
        amount: 0, // Admin will set this manually
        status: 'pending',
        method: 'Passkey: ' + passkey.trim()
      });

      setStatus('success');
      setPasskey('');
      fetchRecentRequests();
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">{t('deposit.title')}</h1>
        <p className="text-brand-silver-dark max-w-lg mx-auto">
          {t('deposit.contactAdmin')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Passkey Entry */}
        <div className="glass-panel p-8 rounded-3xl border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={80} className="text-brand-blue" />
          </div>

          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
             <ShieldCheck size={20} className="text-brand-blue" />
             {t('deposit.enterPasskey')}
          </h2>

          <form onSubmit={handleSubmitPasskey} className="space-y-6">
            <div className="space-y-2">
              <input
                type="text"
                required
                value={passkey}
                onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                placeholder="TX-XXXX-XXXX"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-6 text-xl font-mono tracking-widest text-center focus:outline-none focus:border-brand-blue transition-all"
              />
            </div>

            {status === 'success' && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-start gap-3 animate-in zoom-in-95">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('deposit.success')}</p>
                  <p className="opacity-80">{t('deposit.wait')}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3 animate-in zoom-in-95">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || status === 'success'}
              className="w-full bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-4 font-bold transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {t('deposit.complete')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* History / Status */}
        <div className="glass-panel p-8 rounded-3xl border-white/10">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
             <Clock size={20} className="text-brand-silver-dark" />
             {t('deposit.recent')}
          </h2>

          <div className="space-y-4">
            {recentRequests.map((req) => (
              <div key={req.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-brand-silver-dark uppercase tracking-wider">{t('deposit.status')}</div>
                  <div className={`text-sm font-bold ${req.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}`}>
                    {req.status === 'pending' ? t('deposit.waitingForAdmin') : t('deposit.completed')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-brand-silver-dark">{new Date(req.created_at).toLocaleDateString()}</div>
                  <div className="text-lg font-mono font-bold">${req.amount}</div>
                </div>
              </div>
            ))}

            {recentRequests.length === 0 && (
              <div className="text-center py-12 text-brand-silver-dark/40 border-2 border-dashed border-white/5 rounded-2xl">
                 {t('deposit.noActivity')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
