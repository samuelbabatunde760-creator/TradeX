'use client';
import Link from 'next/link';
import { ArrowRight, BarChart3, Shield, Zap, Globe, Cpu, ShieldCheck, Clock } from 'lucide-react';
import { useLanguage } from '@/app/components/LanguageContext';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-blue/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="w-2 h-2 rounded-full bg-brand-blue animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-silver-dark">{t('common.secure')} {t('common.protocol')} V4.2</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {t('hero.title')} <br />
            <span className="bg-gradient-to-r from-white via-white to-brand-blue/50 bg-clip-text text-transparent italic">TradeX</span>
          </h1>

          <p className="text-lg md:text-xl text-brand-silver-dark max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-600">
            <Link 
              href="/register" 
              className="px-8 py-4 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl font-bold transition-all shadow-xl shadow-brand-blue/20 flex items-center gap-2 group"
            >
              {t('hero.startTrading')}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all"
            >
              {t('hero.viewMarkets')}
            </Link>
          </div>
        </div>

        {/* Floating Trading Card Preview */}
        <div className="max-w-5xl mx-auto mt-24 px-6 relative z-10 animate-in fade-in zoom-in duration-1000 delay-800">
          <div className="glass-panel p-8 rounded-3xl border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 font-bold text-xl">₿</div>
                <div>
                  <div className="font-bold text-xl">BTC / USD</div>
                  <div className="text-xs text-brand-silver-dark">Bitcoin Core • {t('hero.livePrice')}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-brand-blue font-mono font-bold text-2xl">$64,230.50</div>
                <div className="text-green-400 text-sm font-medium flex items-center justify-end gap-1">
                  <Zap size={14} /> +2.4%
                </div>
              </div>
            </div>

            <div className="h-48 flex items-end gap-3 px-2">
              {[40, 60, 45, 70, 55, 80, 65, 90, 75, 100].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-700 ease-out hover:brightness-125 ${i % 2 === 0 ? 'bg-red-500/60' : 'bg-green-500/60'}`} 
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="absolute top-[-10%] bottom-[-10%] w-[1px] bg-white/10 -z-10 group-hover:bg-white/30 transition-colors"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-32 grid md:grid-cols-3 gap-8 relative z-10">
        <div className="glass-panel p-10 rounded-3xl hover:-translate-y-2 transition-all duration-300 border-white/10 group">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-8 border border-brand-blue/20 group-hover:bg-brand-blue group-hover:text-white transition-all">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-4">{t('features.secure')}</h3>
          <p className="text-brand-silver-dark leading-relaxed">
            {t('features.secureDesc')}
          </p>
        </div>

        <div className="glass-panel p-10 rounded-3xl hover:-translate-y-2 transition-all duration-300 border-white/10 group">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-8 border border-brand-blue/20 group-hover:bg-brand-blue group-hover:text-white transition-all">
            <Zap size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-4">{t('features.fast')}</h3>
          <p className="text-brand-silver-dark leading-relaxed">
            {t('features.fastDesc')}
          </p>
        </div>

        <div className="glass-panel p-10 rounded-3xl hover:-translate-y-2 transition-all duration-300 border-white/10 group">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-8 border border-brand-blue/20 group-hover:bg-brand-blue group-hover:text-white transition-all">
            <Clock size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-4">{t('features.access')}</h3>
          <p className="text-brand-silver-dark leading-relaxed">
            {t('features.accessDesc')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-black italic tracking-tighter">TradeX</div>
          <div className="flex gap-8 text-sm text-brand-silver-dark font-medium">
            <Link href="/terms" className="hover:text-white transition-colors">{t('auth.terms')}</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">{t('auth.privacy')}</Link>
          </div>
          <div className="text-xs text-brand-silver-dark uppercase tracking-widest font-bold">
            © 2026 {t('common.copyright')}
          </div>
        </div>
      </footer>
    </main>
  );
}
