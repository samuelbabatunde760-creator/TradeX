'use client';
import dynamic from 'next/dynamic';
import Loading from './loading';

// Dynamically import the heavy trading terminal with a loading skeleton
const TradingTerminal = dynamic(() => import('./components/TradingTerminal'), {
  ssr: false,
  loading: () => <Loading />
});

export default function DashboardPage() {
  return (
    <div className="h-full">
      <TradingTerminal />
    </div>
  );
}
