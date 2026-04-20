import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full pb-10 animate-pulse">
      {/* Chart Area Skeleton */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden min-h-[450px] border-white/5 bg-white/5">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
              <div className="w-24 h-6 bg-white/10 rounded"></div>
            </div>
            <div className="w-32 h-10 bg-white/10 rounded-xl"></div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="text-brand-blue/20 animate-spin" size={48} />
          </div>
        </div>
        <div className="hidden lg:block h-48 glass-panel rounded-2xl bg-white/5 border-white/5"></div>
      </div>

      {/* Trading Panel Skeleton */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <div className="h-[450px] glass-panel rounded-2xl bg-white/5 border-white/5 p-6 space-y-6">
          <div className="w-1/2 h-8 bg-white/10 rounded mb-8"></div>
          <div className="space-y-4">
             <div className="w-full h-12 bg-white/10 rounded-xl"></div>
             <div className="w-full h-12 bg-white/10 rounded-xl"></div>
             <div className="grid grid-cols-2 gap-4 pt-8">
                <div className="h-20 bg-white/10 rounded-xl"></div>
                <div className="h-20 bg-white/10 rounded-xl"></div>
             </div>
          </div>
        </div>
        <div className="h-24 glass-panel rounded-2xl bg-white/5 border-white/5"></div>
      </div>
    </div>
  );
}
