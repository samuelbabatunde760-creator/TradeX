import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[100]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-blue/20 blur-[80px] rounded-full animate-pulse" />
      
      <div className="relative flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-brand-blue/10 border-t-brand-blue rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(0,183,255,0.2)]"></div>
        
        <div className="flex flex-col items-center gap-2">
           <div className="flex items-center gap-2">
              <span className="text-2xl font-black italic tracking-tighter text-white">TradeX</span>
              <span className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[10px] font-bold rounded uppercase tracking-widest border border-brand-blue/20">Secure</span>
           </div>
           <div className="text-[10px] text-brand-silver-dark uppercase tracking-[0.3em] font-bold animate-pulse">Initializing Protocol</div>
        </div>
      </div>

      <div className="absolute bottom-10 text-[9px] text-brand-silver-dark/40 font-mono tracking-tighter">
        SECURE NODE V4.2.0 • ASSET SYNC IN PROGRESS
      </div>
    </div>
  );
}
