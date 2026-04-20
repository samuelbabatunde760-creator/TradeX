'use client';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export default function PrivacyPage() {
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
              <Lock size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-brand-silver-dark">Last updated: April 20, 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-brand-silver-dark leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Information Collection</h2>
              <p>
                We collect information you provide directly to us when you create an account, make a deposit, or communicate with us. This includes your email address, financial transaction data, and communications.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you about your account and security updates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or destruction. All sensitive data is encrypted and transactions are secured using our proprietary passkey protocol.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Information Sharing</h2>
              <p>
                We do not share your personal information with third parties except as necessary to provide our services, comply with the law, or protect our rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Cookies</h2>
              <p>
                We use cookies and similar technologies to track activity on our platform and hold certain information to improve your user experience and secure your session.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information. If you have any questions about how we handle your data, please contact our support team.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-3 text-sm text-brand-blue font-medium">
            <ShieldCheck size={20} />
            Your privacy is protected by end-to-end encryption.
          </div>
        </div>
      </div>
    </main>
  );
}
