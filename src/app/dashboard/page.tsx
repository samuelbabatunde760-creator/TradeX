'use client';
import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';
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

export default function DashboardPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState('100');
  const [timeframe, setTimeframe] = useState('1m');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState(64000);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

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
      height: chartContainerRef.current.clientHeight,
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

    // Live Chart Logic
    let lastCandle = data[data.length - 1];
    let ticks = 0;

    const interval = setInterval(() => {
      const volatility = 50;
      const change = (Math.random() - 0.5) * volatility;
      const newClose = lastCandle.close + change;
      setCurrentPrice(newClose);
      
      ticks++;
      
      // If 30 ticks (approx 30 seconds at 1s interval), start a new candle
      if (ticks >= 30) {
        ticks = 0;
        const newTime = lastCandle.time + 30; // Move 30 seconds forward
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
    }, 1000); // 1 second interval for smooth movement

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  const fetchTrades = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('trades').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(5);
    if (data) setRecentTrades(data);
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const placeTrade = async (direction: 'call' | 'put') => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const userId = session.user.id;
      const numAmount = parseFloat(amount);
      const entryPrice = currentPrice;
      
      // Get current balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (userError || !userData) throw new Error('Could not fetch balance');
      if (userData.balance < numAmount) throw new Error('Insufficient balance');
      
      // 1. Deduct balance immediately
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: userData.balance - numAmount })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
      // 2. Record Trade with entry price
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
      
      // 3. Resolve Trade after timeframe
      // For the demo, we shorten the time: 1m -> 10s, 5m -> 20s, 15m -> 30s
      const delay = timeframe === '1m' ? 10000 : timeframe === '5m' ? 20000 : 30000;
      
      setTimeout(async () => {
        // Simple logic: 50/50 win/loss for now, but feels real
        const won = Math.random() > 0.45; // Slightly biased to house or user? 
        const profit = won ? numAmount * 1.85 : 0;
        const result = won ? 'win' : 'loss';
        
        // Update trade record
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
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full">
      {/* Chart Area */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">BTC/USD</span>
            <span className="px-2 py-1 bg-brand-blue/20 text-brand-blue text-xs font-semibold rounded">Crypto</span>
          </div>
          <div className="text-sm text-brand-silver-dark flex gap-4">
            <span>24h Vol: 45.2K BTC</span>
          </div>
        </div>
        <div className="flex-1 w-full relative" ref={chartContainerRef} />
      </div>

      {/* Trading Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-6 border-b border-white/10 pb-3">Execute Order</h3>
          
          {message && (
            <div className={`p-3 mb-4 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
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
                  className="w-full bg-background/50 border border-white/10 rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-brand-blue transition-colors font-mono"
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
                        ? 'bg-brand-blue/20 border-brand-blue text-brand-blue border' 
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
                onClick={() => placeTrade('call')}
                disabled={loading}
                className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <ArrowUpCircle size={24} />
                CALL
              </button>
              <button 
                onClick={() => placeTrade('put')}
                disabled={loading}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <ArrowDownCircle size={24} />
                PUT
              </button>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-xs text-brand-silver-dark">Payout: 85%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="glass-panel p-6 rounded-2xl flex-1">
          <h4 className="text-sm font-bold text-brand-silver-dark uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={14} /> Open Positions
          </h4>
          <div className="space-y-3">
            {recentTrades.filter(t => t.result === 'pending').map(trade => (
              <div key={trade.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center animate-pulse">
                <div>
                  <div className="text-xs font-bold text-white uppercase">{trade.direction} - {trade.asset}</div>
                  <div className="text-[10px] text-brand-silver-dark">{trade.timeframe} Duration</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-brand-blue">${trade.amount}</div>
                  <div className="text-[9px] text-yellow-500 font-bold uppercase">Executing...</div>
                </div>
              </div>
            ))}
            {recentTrades.filter(t => t.result !== 'pending').slice(0, 2).map(trade => (
              <div key={trade.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center opacity-60">
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
            {recentTrades.length === 0 && (
              <div className="text-center py-8 text-[10px] text-brand-silver-dark uppercase tracking-widest">No active trades</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
