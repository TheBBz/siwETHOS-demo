/**
 * Home Page
 *
 * Landing page with information about Sign in with Ethos
 * and demo functionality.
 */

import { ensureProvidersInitialized } from '@/lib/providers';
import { ensureDemoClient } from '@/lib/clients';
import { DemoButton } from '@/components/DemoButton';

// Force dynamic rendering to ensure demo client is created
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  ensureProvidersInitialized();
  await ensureDemoClient();

  return (
    <div className="min-h-screen hero-gradient overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="gradient-orb w-[600px] h-[600px] -top-[200px] -left-[200px]" />
        <div 
          className="gradient-orb w-[500px] h-[500px] top-[40%] -right-[150px]"
          style={{ animationDelay: '-5s' }}
        />
        <div 
          className="gradient-orb w-[400px] h-[400px] bottom-[10%] left-[20%]"
          style={{ animationDelay: '-10s' }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in">
            <span className="pulse-dot" />
            <span className="text-sm text-text-secondary">Powered by Ethos Network</span>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl opacity-60 bg-primary rounded-full scale-150" />
              <div className="relative icon-gradient w-24 h-24 rounded-3xl shadow-2xl">
                <svg
                  className="w-12 h-12 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="text-gradient">Sign in with</span>
            <br />
            <span className="text-white">Ethos</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            Decentralized authentication with{' '}
            <span className="text-accent-teal font-medium">reputation-aware</span>{' '}
            identity verification
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <DemoButton />
            <a
              href="https://github.com/thebbz/siwETHOS"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 pt-16 border-t border-white/5">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">SIWE</div>
              <div className="text-sm text-text-tertiary">Standard</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-1">0-2800</div>
              <div className="text-sm text-text-tertiary">Credibility Range</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">OAuth 2.0</div>
              <div className="text-sm text-text-tertiary">Compatible</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Sign in with Ethos?
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Combine the security of wallet-based authentication with the power of on-chain reputation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="feature-card group">
              <div className="icon-gradient w-14 h-14 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Wallet-Based Auth</h3>
              <p className="text-text-secondary leading-relaxed">
                Connect your Ethereum wallet to cryptographically prove ownership. No passwords, no centralized accounts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card group">
              <div className="icon-gradient w-14 h-14 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Credibility Score</h3>
              <p className="text-text-secondary leading-relaxed">
                Access users&apos; Ethos credibility scores (0-2800) to build trust-aware features and reduce fraud.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card group">
              <div className="icon-gradient w-14 h-14 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">SIWE Standard</h3>
              <p className="text-text-secondary leading-relaxed">
                Built on Sign-In with Ethereum (EIP-4361). Secure, decentralized, and widely adopted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary-light text-sm font-medium mb-6">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Setup
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Integrate in Minutes
                </h2>
                <p className="text-text-secondary text-lg mb-8">
                  Add wallet-based authentication to your app with just a few lines of code
                </p>

                {/* Steps */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold shrink-0">1</div>
                    <div>
                      <div className="font-medium text-white">Install the SDK</div>
                      <code className="text-sm text-text-tertiary font-mono">npm install @thebbz/siwe-ethos</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold shrink-0">2</div>
                    <div>
                      <div className="font-medium text-white">Initialize & Configure</div>
                      <code className="text-sm text-text-tertiary font-mono">EthosWalletAuth.init({'{ ... }'})</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold shrink-0">3</div>
                    <div>
                      <div className="font-medium text-white">Sign In Users</div>
                      <code className="text-sm text-text-tertiary font-mono">auth.signIn(address, signer)</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Preview */}
              <div className="code-block overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-text-tertiary">example.tsx</span>
                </div>
                <pre className="p-4 text-sm overflow-x-auto">
                  <code className="text-text-secondary font-mono">
{`const auth = EthosWalletAuth.init({
  authServerUrl: '${process.env.AUTH_SERVER_URL || 'https://ethos.thebbz.xyz'}'
});

const result = await auth.signIn(
  address,
  signMessageAsync
);

// Access credibility data
console.log(result.user.ethosScore);
console.log(result.user.ethosUsername);`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Links */}
      <section className="relative py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8">
            <a
              href="https://github.com/thebbz/siwETHOS#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group"
            >
              <span className="text-xl">📚</span>
              <span>Documentation</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
            <a
              href="https://github.com/thebbz/siwETHOS/tree/main/docs/sdk-usage.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group"
            >
              <span className="text-xl">💻</span>
              <span>SDK Reference</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
            <a
              href="https://github.com/thebbz/siwETHOS/tree/main/docs/self-hosting.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group"
            >
              <span className="text-xl">🚀</span>
              <span>Self-Hosting</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-text-tertiary">
            Open source under MIT license •{' '}
            <a
              href="https://github.com/thebbz/siwETHOS"
              className="text-text-secondary hover:text-white transition-colors"
            >
              GitHub
            </a>
            {' '}•{' '}
            <a
              href="https://ethos.network"
              className="text-text-secondary hover:text-white transition-colors"
            >
              Ethos Network
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
