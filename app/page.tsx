"use client";
import { MainLayout } from "@/client/components/layouts";
import {
  TradingMode,
  IntentComparator,
  SolverRace,
  WhySuiPanel,
  ReferralDashboard,
  LendingDashboard,
  StrategyDashboard,
} from "@/client/components/features";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Zap,
  Users,
  Coins,
  BarChart3,
  Sparkles,
  Landmark,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Trade Privately on DeepBook
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Submit encrypted intents, let solvers compete for best execution,
            and verify with ZK proofs. No MEV, no front-running.
          </p>
        </div>

        <Tabs defaultValue="trade" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800/50 border border-white/5 p-1 rounded-xl h-auto mb-8">
            <TabsTrigger
              value="trade"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Trade</span>
            </TabsTrigger>
            <TabsTrigger
              value="compare"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger
              value="lending"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Landmark className="h-4 w-4" />
              <span className="hidden sm:inline">Lending</span>
            </TabsTrigger>
            <TabsTrigger
              value="strategies"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-teal-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Strategies</span>
            </TabsTrigger>
            <TabsTrigger
              value="solvers"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Solvers</span>
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger
              value="why-sui"
              className="flex items-center gap-2 py-3 data-[state=active]:bg-linear-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Why Sui</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trade" className="mt-0">
            <TradingMode />
          </TabsContent>

          <TabsContent value="compare" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IntentComparator />
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/20">
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    The MEV Problem
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    On transparent order books, everyone sees your trade before
                    it executes. This creates opportunities for:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-red-300">
                      <span className="text-red-400">•</span>
                      Front-running: Bots trade ahead of you
                    </li>
                    <li className="flex items-center gap-2 text-red-300">
                      <span className="text-red-400">•</span>
                      Sandwich attacks: You get worse prices
                    </li>
                    <li className="flex items-center gap-2 text-red-300">
                      <span className="text-red-400">•</span>
                      Information leakage: Market moves against you
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20">
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-400" />
                    Our Solution
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    ZK-IntentBook encrypts your intent until execution. Solvers
                    compete without seeing your exact order, and ZK proofs
                    verify correct execution.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-green-300">
                      <span className="text-green-400">✓</span>
                      Intent encryption with hash commitments
                    </li>
                    <li className="flex items-center gap-2 text-green-300">
                      <span className="text-green-400">✓</span>
                      Competitive solver auction
                    </li>
                    <li className="flex items-center gap-2 text-green-300">
                      <span className="text-green-400">✓</span>
                      On-chain ZK verification
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lending" className="mt-0">
            <LendingDashboard />
          </TabsContent>

          <TabsContent value="strategies" className="mt-0">
            <StrategyDashboard />
          </TabsContent>

          <TabsContent value="solvers" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SolverRace />
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20">
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    Decentralized Execution
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Unlike centralized relays, ZK-IntentBook uses competitive
                    solver markets:
                  </p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2 text-slate-300">
                      <span className="text-blue-400 mt-1">1.</span>
                      <span>
                        You submit an encrypted intent with a commitment hash
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-300">
                      <span className="text-blue-400 mt-1">2.</span>
                      <span>
                        Multiple solvers attempt to match and fill your order
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-300">
                      <span className="text-blue-400 mt-1">3.</span>
                      <span>
                        Each solver generates a ZK proof of correct execution
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-300">
                      <span className="text-blue-400 mt-1">4.</span>
                      <span>Fastest valid proof wins the execution reward</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl bg-slate-800/50 border border-white/5">
                  <h4 className="font-semibold text-white mb-2">
                    Why Competition Matters
                  </h4>
                  <p className="text-xs text-slate-400">
                    Solver competition ensures no single party can extract value
                    from your trades. Solvers earn fees from successful
                    executions, creating economic incentives for fast and
                    accurate matching. AI-powered solvers are possible, but the
                    protocol trusts math—not algorithms.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReferralDashboard />
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20">
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-green-400" />
                    Sustainable Economics
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    ZK-IntentBook integrates with DeepBook&apos;s native
                    referral system:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-green-300">
                      <span className="text-green-400">•</span>
                      Frontend operators earn referral fees
                    </li>
                    <li className="flex items-center gap-2 text-green-300">
                      <span className="text-green-400">•</span>
                      Fees committed in ZK proofs (tamper-proof)
                    </li>
                    <li className="flex items-center gap-2 text-green-300">
                      <span className="text-green-400">•</span>
                      No new token required
                    </li>
                    <li className="flex items-center gap-2 text-green-300">
                      <span className="text-green-400">•</span>
                      Aligned with DeepBook incentives
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl bg-slate-800/50 border border-white/5">
                  <h4 className="font-semibold text-white mb-2">
                    How Fees Flow
                  </h4>
                  <div className="text-xs text-slate-400 space-y-2">
                    <p>1. User submits intent through frontend</p>
                    <p>
                      2. Frontend&apos;s referral address is committed in the ZK
                      proof
                    </p>
                    <p>3. Solver executes trade on DeepBook with referral</p>
                    <p>4. DeepBook distributes DEEP token rewards</p>
                    <p>5. Frontend claims accumulated fees</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="why-sui" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WhySuiPanel />
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20">
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-cyan-400" />
                    Built for Sui
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    ZK-IntentBook is designed specifically for Sui&apos;s
                    architecture:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-cyan-300">
                      <span className="text-cyan-400">•</span>
                      PTBs enable atomic multi-step operations
                    </li>
                    <li className="flex items-center gap-2 text-cyan-300">
                      <span className="text-cyan-400">•</span>
                      Object model allows parallel execution
                    </li>
                    <li className="flex items-center gap-2 text-cyan-300">
                      <span className="text-cyan-400">•</span>
                      Move provides formal verification
                    </li>
                    <li className="flex items-center gap-2 text-cyan-300">
                      <span className="text-cyan-400">•</span>
                      DeepBook integration is native
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl bg-slate-800/50 border border-white/5">
                  <h4 className="font-semibold text-white mb-2">
                    zkLogin Integration
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Sui&apos;s zkLogin provides privacy-preserving
                    authentication. Users can trade without revealing their real
                    identity to solvers—combining OAuth convenience with ZK
                    privacy.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">
                      Google
                    </span>
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">
                      Facebook
                    </span>
                    <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">
                      Twitch
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-500/20 text-slate-300 text-xs">
                      Apple
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
