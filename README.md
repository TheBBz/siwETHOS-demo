# Sign in with Ethos - Demo

<p align="center">
  <a href="https://ethos.thebbz.xyz">Live Demo</a> •
  <a href="https://github.com/TheBBz/siwETHOS">SDK Repository</a> •
  <a href="https://www.npmjs.com/package/@thebbz/siwe-ethos-react">React Package</a>
</p>

Demo application for [Sign in with Ethos](https://github.com/TheBBz/siwETHOS) - wallet-based authentication with [Ethos Network](https://ethos.network) credibility scores.

## 🚀 Live Demo

**[ethos.thebbz.xyz](https://ethos.thebbz.xyz)**

## Features

- 🔐 **Wallet Authentication** - MetaMask, Rabby, Phantom, Zerion, Coinbase, Brave
- 🌐 **Social Logins** - Farcaster, Discord, Twitter/X, Telegram
- 📊 **Credibility Scores** - Display Ethos reputation (0-2800)
- ⚡ **No Gas Fees** - Signature-only, no transactions

## NPM Packages

This demo uses the official Sign in with Ethos packages:

| Package | Version | Description |
|---------|---------|-------------|
| [`@thebbz/siwe-ethos`](https://www.npmjs.com/package/@thebbz/siwe-ethos) | [![npm](https://img.shields.io/npm/v/@thebbz/siwe-ethos.svg)](https://www.npmjs.com/package/@thebbz/siwe-ethos) | Core SDK |
| [`@thebbz/siwe-ethos-react`](https://www.npmjs.com/package/@thebbz/siwe-ethos-react) | [![npm](https://img.shields.io/npm/v/@thebbz/siwe-ethos-react.svg)](https://www.npmjs.com/package/@thebbz/siwe-ethos-react) | React components |
| [`@thebbz/siwe-ethos-providers`](https://www.npmjs.com/package/@thebbz/siwe-ethos-providers) | [![npm](https://img.shields.io/npm/v/@thebbz/siwe-ethos-providers.svg)](https://www.npmjs.com/package/@thebbz/siwe-ethos-providers) | Server utilities |

## Quick Start

### Using the React Package

The easiest way to add "Sign in with Ethos" to your app:

```bash
npm install @thebbz/siwe-ethos-react
```

```tsx
import { useState } from 'react';
import { EthosAuthModal, EthosAuthResult } from '@thebbz/siwe-ethos-react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<EthosAuthResult | null>(null);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        {user ? `Hello, ${user.profile.displayName}` : 'Sign in with Ethos'}
      </button>

      <EthosAuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(result) => {
          setUser(result);
          setIsOpen(false);
          console.log('Ethos Score:', result.profile.score);
        }}
      />
    </>
  );
}
```

## Self-Hosting This Demo

### Prerequisites

- Node.js 18+
- pnpm
- [Upstash Redis](https://upstash.com) account (for serverless storage)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/TheBBz/siwETHOS-demo.git
   cd siwETHOS-demo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   # Required
   AUTH_SERVER_URL=https://your-domain.com
   JWT_SECRET=your-strong-random-secret
   
   # Upstash Redis (for nonce storage)
   UPSTASH_REDIS_REST_URL=your-upstash-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-token
   
   # Social Providers (optional)
   TELEGRAM_BOT_USERNAME=your_bot
   TELEGRAM_BOT_TOKEN=your-bot-token
   DISCORD_CLIENT_ID=your-client-id
   DISCORD_CLIENT_SECRET=your-client-secret
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TheBBz/siwETHOS-demo)

## Project Structure

```
siwETHOS-demo/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # Auth endpoints
│   │   │   │   ├── nonce/      # SIWE nonce generation
│   │   │   │   ├── wallet/     # Wallet verification
│   │   │   │   ├── farcaster/  # Farcaster auth
│   │   │   │   └── telegram/   # Telegram verification
│   │   │   ├── authorize/      # OAuth authorize endpoint
│   │   │   ├── token/          # Token exchange
│   │   │   └── userinfo/       # User info endpoint
│   │   ├── auth/               # Auth flow pages
│   │   │   ├── discord/        # Discord OAuth
│   │   │   ├── farcaster/      # Farcaster QR flow
│   │   │   ├── telegram/       # Telegram widget
│   │   │   └── twitter/        # Twitter OAuth
│   │   ├── connect/            # Main connect page
│   │   └── demo/               # Demo callback page
│   ├── components/
│   │   ├── EthosAuthModal/     # Auth modal component
│   │   └── DemoButton.tsx      # Demo button
│   └── lib/
│       ├── auth.ts             # Auth utilities
│       ├── ethos.ts            # Ethos API client
│       ├── providers.ts        # Provider configs
│       └── storage/            # Storage adapters
├── public/
└── package.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/nonce` | GET | Generate SIWE nonce |
| `/api/auth/wallet/verify` | POST | Verify wallet signature |
| `/api/auth/farcaster/status` | GET | Check Farcaster auth status |
| `/api/auth/telegram/verify` | POST | Verify Telegram auth |
| `/api/authorize` | GET | OAuth authorize endpoint |
| `/api/token` | POST | Exchange code for token |
| `/api/userinfo` | GET | Get authenticated user |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SERVER_URL` | Yes | Your deployment URL |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis token |
| `TELEGRAM_BOT_USERNAME` | No | Telegram bot username |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token |
| `DISCORD_CLIENT_ID` | No | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | No | Discord OAuth secret |

## Related

- [Sign in with Ethos SDK](https://github.com/TheBBz/siwETHOS) - Main SDK repository
- [Ethos Network](https://ethos.network) - Create your Ethos profile
- [Ethos API Docs](https://developers.ethos.network) - API documentation

## License

MIT
