import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center pt-16 pb-24">
      {/* Hero Section */}
      <section className="w-full max-w-6xl px-6 flex flex-col md:flex-row items-center gap-12 mt-12 mb-32">
        <div className="flex-1 space-y-8 z-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 text-brand-blue font-medium text-sm">
            The Future of Trading
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight">
            Trade with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-silver">Precision</span> and Power
          </h1>
          <p className="text-xl text-brand-silver-dark max-w-lg">
            Experience next-generation option trading simulations. Unmatched execution speed, secure operations, and professional tools.
          </p>
          <div className="flex gap-4 pt-4">
            <Link href="/register" className="px-8 py-4 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] flex items-center gap-2">
              Get Started <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="px-8 py-4 bg-transparent border border-brand-silver-dark/30 hover:bg-white/5 text-foreground rounded-lg font-semibold transition-all">
              Log In
            </Link>
          </div>
        </div>

        {/* Hero Visual - Simulated Chart Preview */}
        <div className="flex-1 w-full max-w-lg relative z-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/20 to-transparent blur-3xl rounded-full" />
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center font-bold text-xs">BTC</div>
                <div className="font-semibold text-lg">BTC/USD</div>
              </div>
              <div className="text-right">
                <div className="text-brand-blue font-mono font-bold text-xl">$64,230.50</div>
                <div className="text-green-400 text-sm font-medium">+2.4%</div>
              </div>
            </div>
            
            {/* Fake Chart Bars */}
            <div className="h-48 flex items-end gap-2 px-2 mt-8">
              {[40, 60, 45, 70, 55, 80, 65, 90, 75, 100].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-500 ease-in-out ${i % 2 === 0 ? 'bg-red-500/80' : 'bg-green-500/80'}`} 
                    style={{ height: `${height}%` }}
                  ></div>
                  {/* Candlestick wicks */}
                  <div className="absolute top-[-10%] bottom-[-10%] w-[1px] bg-brand-silver/20 -z-10"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-6xl px-6 grid md:grid-cols-3 gap-8 relative z-10">
        <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
          <div className="w-14 h-14 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-6 border border-brand-blue/20">
            <ShieldCheck className="text-brand-blue" size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-3">Secure Operations</h3>
          <p className="text-brand-silver-dark leading-relaxed">
            Bank-grade security protocols with advanced encryption ensure your assets and personal data remain protected at all times.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
          <div className="w-14 h-14 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-6 border border-brand-blue/20">
            <Zap className="text-brand-blue" size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-3">Fast Execution</h3>
          <p className="text-brand-silver-dark leading-relaxed">
            Our high-performance matching engine processes options simulations instantly with zero latency or slippage.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
          <div className="w-14 h-14 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-6 border border-brand-blue/20">
            <Clock className="text-brand-blue" size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-3">24/7 Support</h3>
          <p className="text-brand-silver-dark leading-relaxed">
            Always-on market simulation allowing you to test strategies at any time. Dedicated support available around the clock.
          </p>
        </div>
      </section>
    </main>
  );
}
