import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1F2126",
};

export const metadata: Metadata = {
  title: "Sign in with Ethos",
  description: "Authenticate with your Ethos Network identity. Decentralized, secure, reputation-aware authentication using Sign-In with Ethereum (SIWE).",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Sign in with Ethos",
    description: "Authenticate with your Ethos Network identity. Decentralized, secure, reputation-aware authentication using Sign-In with Ethereum (SIWE).",
    url: "https://ethos.thebbz.xyz",
    siteName: "Sign in with Ethos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign in with Ethos",
    description: "Authenticate with your Ethos Network identity. Decentralized, secure, reputation-aware authentication.",
  },
  metadataBase: new URL("https://ethos.thebbz.xyz"),
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
