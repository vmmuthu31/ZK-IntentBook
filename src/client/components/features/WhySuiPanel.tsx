"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Layers,
  Shield,
  ArrowRight,
  CheckCircle,
  Cpu,
  GitBranch,
  Box,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

function FeatureCard({
  icon,
  title,
  description,
  highlight,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        highlight
          ? "bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30"
          : "bg-slate-800/30 border-white/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "p-2 rounded-lg",
            highlight ? "bg-blue-500/20" : "bg-slate-700/50",
          )}
        >
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-white mb-1">{title}</h4>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function WhySuiPanel() {
  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Why Sui?</CardTitle>
              <CardDescription>
                This design only works cleanly on Sui
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            Sui-Native
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="p-4 rounded-xl bg-linear-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20">
          <h4 className="font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Programmable Transaction Blocks (PTBs)
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs">
                1
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <div className="flex-1 p-2 rounded bg-slate-800/50 text-slate-300">
                ZK Proof Verification
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs">
                2
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <div className="flex-1 p-2 rounded bg-slate-800/50 text-slate-300">
                DeepBook Trade Execution
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs">
                3
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <div className="flex-1 p-2 rounded bg-slate-800/50 text-slate-300">
                Referral Fee Distribution
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-cyan-500/20 text-xs text-cyan-200 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            All operations execute atomically in a single transaction
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FeatureCard
            icon={<Layers className="h-4 w-4 text-blue-400" />}
            title="Parallel Execution"
            description="Sui's object model allows proof verification and settlement to run in parallel, not sequentially"
            highlight
          />
          <FeatureCard
            icon={<Cpu className="h-4 w-4 text-purple-400" />}
            title="Move Verifier"
            description="On-chain ZK verification in native Move bytecode with formal verification guarantees"
          />
          <FeatureCard
            icon={<GitBranch className="h-4 w-4 text-green-400" />}
            title="Object-Centric"
            description="Intents are first-class objects with owned references, not global state"
          />
          <FeatureCard
            icon={<Box className="h-4 w-4 text-amber-400" />}
            title="DeepBook Integration"
            description="Native CLOB integration with referral system for sustainable economics"
          />
        </div>

        <div className="rounded-xl bg-slate-800/50 p-4">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-400" />
            Why Not Other Chains?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="text-slate-400">
                <strong className="text-red-400">EVM Chains:</strong>
              </div>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span>
                  Sequential execution model
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span>
                  No native PTB equivalent
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✗</span>
                  Higher gas for ZK verification
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="text-slate-400">
                <strong className="text-green-400">Sui:</strong>
              </div>
              <ul className="space-y-1 text-slate-400 text-xs">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Parallel by design
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Atomic multi-step PTBs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Optimized Move VM
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/20">
          <div className="text-xs text-blue-200 italic text-center">
            &quot;ZK-IntentBook leverages Sui&apos;s unique architecture to
            achieve what would require multiple transactions and higher costs on
            other chains.&quot;
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
