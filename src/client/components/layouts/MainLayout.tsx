"use client";

import { ReactNode } from "react";
import { ConnectButton, useWallet } from "@suiet/wallet-kit";
import { Shield, Zap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ZkLoginButton } from "../features/ZkLogin";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-indigo-400" />
                <Zap className="absolute -bottom-1 -right-1 h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  ZK-IntentBook
                </h1>
                <p className="text-[10px] text-slate-500 -mt-0.5">
                  Privacy-First Trading
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <NavLink href="/" active>
                Trade
              </NavLink>
              <NavLink href="/demo">Demo</NavLink>
              <NavLink href="/roadmap">Roadmap</NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <NetworkBadge />
              </div>

              <ZkLoginButton />

              <ConnectButton className="!bg-gradient-to-r !from-indigo-600 !to-purple-600 hover:!from-indigo-500 hover:!to-purple-500 !border-0 !rounded-xl !px-4 !py-2 !text-sm !font-medium !transition-all !duration-200" />

              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="bg-slate-950 border-white/5"
                >
                  <nav className="flex flex-col gap-4 mt-8">
                    <NavLink href="/" active>
                      Trade
                    </NavLink>
                    <NavLink href="/demo">Demo</NavLink>
                    <NavLink href="/roadmap">Roadmap</NavLink>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative">{children}</main>

      <footer className="border-t border-white/5 py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© 2026 ZK-IntentBook. Built on Sui.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-300 transition-colors">
                Docs
              </a>
              <a href="#" className="hover:text-slate-300 transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-slate-300 transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`text-sm font-medium transition-colors ${
        active ? "text-white" : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </a>
  );
}

function NetworkBadge() {
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";

  const networkColors: Record<string, string> = {
    mainnet: "bg-green-500/10 text-green-400 border-green-500/20",
    testnet: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    devnet: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${networkColors[network] || networkColors.testnet}`}
    >
      {network.charAt(0).toUpperCase() + network.slice(1)}
    </span>
  );
}
