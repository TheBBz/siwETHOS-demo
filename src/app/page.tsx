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
              href="https://github.com/TheBBz/siwETHOS"
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
              <div className="text-3xl font-bold text-white mb-1">6+</div>
              <div className="text-sm text-text-tertiary">Wallets Supported</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-1">0-2800</div>
              <div className="text-sm text-text-tertiary">Credibility Range</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">4</div>
              <div className="text-sm text-text-tertiary">Social Providers</div>
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
                  Add wallet-based authentication with our React components or SDK
                </p>

                {/* Steps */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold shrink-0">1</div>
                    <div>
                      <div className="font-medium text-white">Install the React Package</div>
                      <code className="text-sm text-text-tertiary font-mono">npm install @thebbz/siwe-ethos-react</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold shrink-0">2</div>
                    <div>
                      <div className="font-medium text-white">Add the Modal Component</div>
                      <code className="text-sm text-text-tertiary font-mono">{'<EthosAuthModal />'}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold shrink-0">3</div>
                    <div>
                      <div className="font-medium text-white">Handle Success</div>
                      <code className="text-sm text-text-tertiary font-mono">onSuccess={(result) =&gt; ...}</code>
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
                  <span className="text-xs text-text-tertiary">App.tsx</span>
                </div>
                <pre className="p-4 text-sm overflow-x-auto">
                  <code className="text-text-secondary font-mono">
{`import { EthosAuthModal } from 
  '@thebbz/siwe-ethos-react';

<EthosAuthModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(result) => {
    // Access user data
    console.log(result.profile.score);
    console.log(result.profile.username);
  }}
/>`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NPM Packages Section */}
      <section className="relative py-24 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              NPM Packages
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Choose the right package for your integration needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* React Package */}
            <a
              href="https://www.npmjs.com/package/@thebbz/siwe-ethos-react"
              target="_blank"
              rel="noopener noreferrer"
              className="feature-card group hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="icon-gradient w-12 h-12 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/>
                  </svg>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Recommended</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">@thebbz/siwe-ethos-react</h3>
              <p className="text-text-secondary text-sm mb-4">
                Ready-to-use React components including the auth modal with wallet & social logins
              </p>
              <div className="flex items-center gap-2 text-primary-light text-sm">
                <span>View on npm</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
            </a>

            {/* SDK Package */}
            <a
              href="https://www.npmjs.com/package/@thebbz/siwe-ethos"
              target="_blank"
              rel="noopener noreferrer"
              className="feature-card group hover:border-primary/50 transition-colors"
            >
              <div className="icon-gradient w-12 h-12 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">@thebbz/siwe-ethos</h3>
              <p className="text-text-secondary text-sm mb-4">
                Core SDK for custom integrations. Works with any JavaScript framework.
              </p>
              <div className="flex items-center gap-2 text-primary-light text-sm">
                <span>View on npm</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
            </a>

            {/* Providers Package */}
            <a
              href="https://www.npmjs.com/package/@thebbz/siwe-ethos-providers"
              target="_blank"
              rel="noopener noreferrer"
              className="feature-card group hover:border-primary/50 transition-colors"
            >
              <div className="icon-gradient w-12 h-12 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">@thebbz/siwe-ethos-providers</h3>
              <p className="text-text-secondary text-sm mb-4">
                Server-side SIWE utilities for self-hosting your own auth server.
              </p>
              <div className="flex items-center gap-2 text-primary-light text-sm">
                <span>View on npm</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Documentation Links */}
      <section className="relative py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8">
            <a
              href="https://github.com/TheBBz/siwETHOS#readme"
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
              href="https://github.com/TheBBz/siwETHOS/blob/main/docs/react-components.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group"
            >
              <span className="text-xl">⚛️</span>
              <span>React Guide</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
            <a
              href="https://github.com/TheBBz/siwETHOS/blob/main/docs/sdk-usage.md"
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
              href="https://github.com/TheBBz/siwETHOS/blob/main/docs/self-hosting.md"
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
              href="https://github.com/TheBBz/siwETHOS"
              className="text-text-secondary hover:text-white transition-colors"
            >
              GitHub
            </a>
            {' '}•{' '}
            <a
              href="https://www.npmjs.com/package/@thebbz/siwe-ethos-react"
              className="text-text-secondary hover:text-white transition-colors"
            >
              npm
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
