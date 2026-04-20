'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

import { useLanguage } from '@/app/components/LanguageContext';

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [session, setSession] = useState<any>(null);
  
  // Hide header on any dashboard route to maximize trading space
  const isDashboard = pathname?.startsWith('/dashboard');

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isDashboard) return null;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b-0 rounded-none bg-background/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-blue rounded flex items-center justify-center font-bold text-white text-lg leading-none pb-0.5 shadow-lg shadow-brand-blue/20">X</div>
          <span className="font-bold text-xl tracking-tight text-white uppercase tracking-wider">Trade<span className="text-brand-blue">X</span></span>
        </Link>
        <nav className="flex gap-4 md:gap-6 items-center">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm font-medium text-brand-silver-dark hover:text-white transition-colors">{t('common.login')}</Link>
          <Link href="/register" className="text-sm font-medium px-4 py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/30 rounded-lg hover:bg-brand-blue/20 transition-all font-semibold uppercase tracking-wider text-xs">
            {t('common.register')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
