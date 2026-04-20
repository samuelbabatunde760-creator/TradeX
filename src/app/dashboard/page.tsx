'use client';
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { ArrowUpCircle, ArrowDownCircle, Clock, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper to generate some fake candlestick data
const generateData = () => {
  const data = [];
  let time = Math.floor(Date.now() / 1000) - 86400 * 30; // 30 days ago
  let currentPrice = 64000;
  
  for (let i = 0; i < 100; i++) {
    const volatility = 500;
    const open = currentPrice;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({ time, open, high, low, close });
    
    currentPrice = close;
    time += 86400; // Next day
  }
  return data;
};

// Memoized Trading Panel to prevent re-renders on price ticks
const OrderPanel = memo(({ onTrade, loading, message, timeframe, setTimeframe, amount, setAmount }: any) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border-white/10">
      <h3 className="font-bold text-lg mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
        <Zap size={18} className="text-brand-blue" /> Execute Order
      </h3>
      
      {message && (
        <div className={`p-3 mb-4 rounded-lg text-sm animate-in fade-in slide-in-from-top-1 duration-300 ${message.startsWith('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {message}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-brand-silver-dark mb-2">Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-medium">$</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-background/50 border border-white/10 rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-brand-blue transition-colors font-mono text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-brand-silver-dark mb-2 flex items-center gap-2">
            <Clock size={14} /> Timeframe
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['1m', '5m', '15m'].map((t) => (
              <button 
                key={t}
                onClick={() => setTimeframe(t)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  timeframe === t 
                    ? 'bg-brand-blue/20 border-brand-blue text-brand-blue border shadow-sm' 
                    : 'bg-white/5 border-transparent text-brand-silver-dark hover:bg-white/10 border'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-white/10">
          <button 
            onClick={() => onTrade('call')}
            disabled={loading}
            className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 active:scale-95"
          >
            <ArrowUpCircle size={24} />
            CALL
          </button>
          <button 
            onClick={() => onTrade('put')}
            disabled={loading}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 active:scale-95"
          >
            <ArrowDownCircle size={24} />
            PUT
          </button>
        </div>
        
        <div className="text-center mt-4">
          <span className="text-[10px] text-brand-silver-dark uppercase tracking-widest font-bold">Payout: 85% • Instant Execution</span>
        </div>
      </div>
    </div>
  );
});

OrderPanel.displayName = 'OrderPanel';

// Memoized Recent Activity
const RecentActivity = memo(({ trades }: any) => {
  const pendingTrades = trades.filter((t: any) => t.result === 'pending');
  const finishedTrades = trades.filter((t: any) => t.result !== 'pending').slice(0, 3);

  return (
    <div className="glass-panel p-6 rounded-2xl flex-1 border-white/10">
      <h4 className="text-sm font-bold text-brand-silver-dark uppercase tracking-widest mb-4 flex items-center gap-2">
        <Clock size={14} /> Open Positions
      </h4>
      <div className="space-y-3">
        {pendingTrades.map((trade: any) => (
          <div key={trade.id} className="p-3 bg-brand-blue/5 rounded-xl border border-brand-blue/20 flex justify-between items-center animate-pulse">
            <div>
              <div className="text-xs font-bold text-white uppercase">{trade.direction} - {trade.asset}</div>
              <div className="text-[10px] text-brand-silver-dark">{trade.timeframe} Duration</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-brand-blue">${trade.amount}</div>
              <div className="text-[9px] text-yellow-500 font-bold uppercase tracking-tighter">Executing...</div>
            </div>
          </div>
        ))}
        {finishedTrades.map((trade: any) => (
          <div key={trade.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center opacity-70">
            <div>
              <div className="text-xs font-bold text-white uppercase">{trade.direction} - {trade.asset}</div>
              <div className="text-[10px] text-brand-silver-dark">{new Date(trade.created_at).toLocaleTimeString()}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-white">${trade.amount}</div>
              <div className={`text-[9px] font-bold uppercase ${trade.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                {trade.result}
              </div>
            </div>
          </div>
        ))}
        {trades.length === 0 && (
          <div className="text-center py-8 text-[10px] text-brand-silver-dark uppercase tracking-widest border border-dashed border-white/5 rounded-xl">
            No active trades
          </div>
        )}
      </div>
    </div>
  );
});

RecentActivity.displayName = 'RecentActivity';

export default function DashboardPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceRef = useRef<number>(64000);

  const [amount, setAmount] = useState('100');
  const [timeframe, setTimeframe] = useState('1m');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [displayPrice, setDisplayPrice] = useState(64000);

  // Use callback for fetching trades to prevent unnecessary re-renders
  const fetchTrades = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('trades').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10);
    if (data) setRecentTrades(data);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#cbd5e1',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const data = generateData();
    candlestickSeries.setData(data as any);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    // Live Chart Logic
    let lastCandle = data[data.length - 1];
    let ticks = 0;

    const interval = setInterval(() => {
      const volatility = 50;
      const change = (Math.random() - 0.5) * volatility;
      const newClose = lastCandle.close + change;
      
      priceRef.current = newClose;
      setDisplayPrice(newClose); // This only causes re-render of parts that use displayPrice
      
      ticks++;
      
      if (ticks >= 30) {
        ticks = 0;
        const newTime = (lastCandle.time as number) + 30;
        const newCandle = {
          time: newTime,
          open: lastCandle.close,
          high: lastCandle.close + Math.random() * volatility,
          low: lastCandle.close - Math.random() * volatility,
          close: lastCandle.close,
        };
        candlestickSeries.update(newCandle as any);
        lastCandle = newCandle;
      } else {
        const updatedCandle = {
          ...lastCandle,
          close: newClose,
          high: Math.max(lastCandle.high, newClose),
          low: Math.min(lastCandle.low, newClose),
        };
        candlestickSeries.update(updatedCandle as any);
        lastCandle = updatedCandle;
      }
    }, 1000);

    window.addEventListener('resize', handleResize);
    fetchTrades();

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [fetchTrades]);

  const placeTrade = useCallback(async (direction: 'call' | 'put') => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const userId = session.user.id;
      const numAmount = parseFloat(amount);
      const entryPrice = priceRef.current; // Use the ref for latest price
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (userError || !userData) throw new Error('Could not fetch balance');
      if (userData.balance < numAmount) throw new Error('Insufficient balance');
      
      await supabase.from('users').update({ balance: userData.balance - numAmount }).eq('id', userId);
      
      const { data: tradeData, error: tradeError } = await supabase.from('trades').insert([{
        user_id: userId,
        asset: 'BTC/USD',
        direction,
        amount: numAmount,
        timeframe,
        result: 'pending'
      }]).select().single();
      
      if (tradeError) throw tradeError;
      
      setMessage(`Order Placed: $${numAmount} ${direction.toUpperCase()} at ${entryPrice.toFixed(2)}`);
      fetchTrades();
      
      const delay = timeframe === '1m' ? 10000 : timeframe === '5m' ? 20000 : 30000;
      
      setTimeout(async () => {
        const won = Math.random() > 0.45;
        const profit = won ? numAmount * 1.85 : 0;
        const result = won ? 'win' : 'loss';
        
        await supabase.from('trades').update({ result }).eq('id', tradeData.id);
        
        if (won) {
           const { data: latestUser } = await supabase.from('users').select('balance').eq('id', userId).single();
           if(latestUser) {
             await supabase.from('users').update({ balance: latestUser.balance + profit }).eq('id', userId);
           }
        }
        
        setMessage(won ? `🎉 YOU WON! Profit: $${profit.toFixed(2)}` : `📉 Trade Closed. Result: LOSS`);
        fetchTrades();
      }, delay);
      
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [amount, timeframe, fetchTrades]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full pb-10">
      {/* Chart Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden min-h-[450px] border-white/10 shadow-2xl">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-500 font-bold">₿</div>
              <span className="font-bold text-lg">BTC / USD</span>
              <span className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[10px] font-bold rounded uppercase tracking-wider border border-brand-blue/20">Live Protocol</span>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <div className="text-[10px] text-brand-silver-dark uppercase font-bold tracking-widest">Market Price</div>
                  <div className={`font-mono font-bold text-xl tabular-nums ${displayPrice > 64000 ? 'text-green-400' : 'text-red-400'}`}>
                    ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
               </div>
            </div>
          </div>
          <div className="flex-1 w-full relative p-2" ref={chartContainerRef} />
        </div>

        {/* Desktop History can go here or sidebar */}
        <div className="hidden lg:block">
           <RecentActivity trades={recentTrades} />
        </div>
      </div>

      {/* Trading Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <OrderPanel 
          onTrade={placeTrade} 
          loading={loading} 
          message={message} 
          timeframe={timeframe} 
          setTimeframe={setTimeframe}
          amount={amount}
          setAmount={setAmount}
        />
        
        <div className="lg:hidden">
          <RecentActivity trades={recentTrades} />
        </div>

        <div className="glass-panel p-6 rounded-2xl border-white/10 flex items-center gap-4 bg-brand-blue/5">
          <div className="w-12 h-12 bg-brand-blue/20 text-brand-blue rounded-xl flex items-center justify-center border border-brand-blue/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase">Secure Node</div>
            <div className="text-[10px] text-brand-silver-dark">SSL Encrypted Terminal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
