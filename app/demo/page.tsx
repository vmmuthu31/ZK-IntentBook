"use client";

import { MainLayout } from "@/client/components/layouts";
import {
  IntentComparator,
  SolverRace,
  WhySuiPanel,
  ReferralDashboard,
} from "@/client/components/features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Play,
  CheckCircle,
  Clock,
  Monitor,
  FileText,
  Sparkles,
} from "lucide-react";

const demoSteps = [
  {
    step: 1,
    title: "See the Problem",
    description: "Drag the trade size slider to see MEV/slippage impact",
    duration: "30s",
  },
  {
    step: 2,
    title: "Watch Solver Competition",
    description: "Click 'Start Solver Race' to see decentralized execution",
    duration: "20s",
  },
  {
    step: 3,
    title: "Understand Sui Advantages",
    description: "Review PTB workflow and parallel execution",
    duration: "15s",
  },
  {
    step: 4,
    title: "See Revenue Model",
    description: "Check referral transparency dashboard",
    duration: "15s",
  },
];

export default function DemoPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Trophy className="h-3 w-3 mr-1" />
            Judge Demo Mode
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
            ZK-IntentBook Demo
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Private, MEV-resistant trading on DeepBook using ZK proofs
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {demoSteps.map((item) => (
            <Card key={item.step} className="bg-slate-800/50 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                    {item.step}
                  </div>
                  <span className="text-xs text-slate-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {item.duration}
                  </span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <IntentComparator />
          <SolverRace />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <WhySuiPanel />
          <ReferralDashboard />
        </div>

        <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-amber-400" />
              60-Second Demo Script
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-slate-300">
              <p className="italic text-amber-200">
                &quot;This is a $1,000 trade on DeepBook. Normally, everyone
                sees your order before it executes—MEV bots can front-run
                you.&quot;
              </p>
              <p className="italic text-green-200">
                &quot;Now watch what happens with ZK-IntentBook. I toggle
                Private Mode... my intent is encrypted. No one sees the
                price.&quot;
              </p>
              <p className="italic text-blue-200">
                &quot;Behind the scenes, solvers compete to fill my order. They
                have to prove they executed correctly using ZK proofs.&quot;
              </p>
              <p className="italic text-cyan-200">
                &quot;The winning solver&apos;s proof is verified on-chain, the
                trade settles on DeepBook, and I pay less slippage.&quot;
              </p>
              <p className="italic text-purple-200">
                &quot;This works because Sui&apos;s PTBs let us verify the proof
                and settle the trade in one atomic transaction.&quot;
              </p>
              <p className="italic text-slate-200">
                &quot;The frontend earns referral fees. The user gets privacy.
                DeepBook keeps its liquidity.&quot;
              </p>
              <div className="pt-4 border-t border-amber-500/20">
                <p className="font-bold text-white text-lg">
                  <Sparkles className="h-5 w-5 inline mr-2 text-amber-400" />
                  ZK-IntentBook: Private trading infrastructure for Sui.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-white/5">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Move Contracts: Real</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Rust ZK Prover: Real</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>TypeScript Solver: Real</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-amber-400" />
              <span>Race Visualization: Simulated</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
