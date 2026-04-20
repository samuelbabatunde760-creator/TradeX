'use client';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/register" className="inline-flex items-center gap-2 text-brand-silver-dark hover:text-white transition-colors mb-8 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Registration
        </Link>

        <div className="glass-panel p-8 md:p-12 rounded-3xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-brand-silver-dark">Last updated: April 20, 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-brand-silver-dark leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the TradeX platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Trading Risks</h2>
              <p>
                Trading in financial markets involves significant risk. You acknowledge that you are aware of the risks associated with trading, including the potential for substantial losses. TradeX is not responsible for any financial losses incurred while using our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Account Security</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. We reserve the right to refuse service, terminate accounts, or remove content in our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Secure Deposits</h2>
              <p>
                All deposits must be completed through our secure passkey protocol. Users must contact an authorized administrator to receive a unique passkey for every transaction. Unauthorized or manipulated transactions will be flagged and may lead to account suspension.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Prohibited Activities</h2>
              <p>
                You may not use the platform for any illegal purpose or in violation of any local, state, national, or international law. This includes but is not limited to money laundering, fraud, or market manipulation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
              <p>
                TradeX shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-3 text-sm text-brand-blue font-medium">
            <ShieldCheck size={20} />
            Your security is our top priority.
          </div>
        </div>
      </div>
    </main>
  );
}
