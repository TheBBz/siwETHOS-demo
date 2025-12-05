import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1F2125",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Sign in with Ethos",
    template: "%s | Sign in with Ethos",
  },
  description: "Authenticate with your Ethos Network identity. Decentralized, secure, reputation-aware authentication using Sign-In with Ethereum (SIWE). Connect your wallet or social accounts.",
  keywords: [
    "Ethos Network",
    "SIWE",
    "Sign-In with Ethereum",
    "Web3 authentication",
    "decentralized identity",
    "wallet login",
    "reputation",
    "credibility score",
    "OAuth",
    "Farcaster",
    "Discord",
    "Telegram",
  ],
  authors: [{ name: "Ethos Network", url: "https://ethos.network" }],
  creator: "Ethos Network",
  publisher: "Ethos Network",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", sizes: "any" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Sign in with Ethos",
    description: "Decentralized, secure, reputation-aware authentication. Connect your wallet or social accounts to authenticate with your Ethos Network identity.",
    url: "https://dev.ethos.thebbz.xyz",
    siteName: "Sign in with Ethos",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Sign in with Ethos - Web3 Authentication",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign in with Ethos",
    description: "Decentralized, secure, reputation-aware authentication using Sign-In with Ethereum (SIWE).",
    images: ["/og-image.svg"],
    creator: "@ethosnetwork",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL("https://dev.ethos.thebbz.xyz"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
