import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  WalletProvider,
  ThemeProvider,
  ZkLoginProvider,
} from "@/client/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZK-IntentBook | Privacy-First Trading on DeepBook",
  description:
    "A privacy-preserving, intent-based trading frontend for DeepBook. Submit encrypted intents, let solvers compete, and trade with ZK-verified MEV protection.",
  keywords: ["Sui", "DeepBook", "ZK", "Privacy", "Trading", "DeFi", "Intent"],
  openGraph: {
    title: "ZK-IntentBook",
    description: "Privacy-First Trading on DeepBook",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <WalletProvider>
            <ZkLoginProvider>{children}</ZkLoginProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
