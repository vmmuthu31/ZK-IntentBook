"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MainLayout } from "@/client/components/layouts/MainLayout";
import {
  CheckCircle,
  Clock,
  Rocket,
  Shield,
  TrendingUp,
  Wallet,
  Lock,
  Zap,
  Users,
  BookOpen,
  Coins,
  Target,
} from "lucide-react";

type RoadmapPhase = {
  title: string;
  status: "completed" | "in-progress" | "upcoming";
  progress: number;
  items: {
    title: string;
    description: string;
    status: "completed" | "in-progress" | "upcoming";
    icon: React.ReactNode;
  }[];
};

const roadmapPhases: RoadmapPhase[] = [
  {
    title: "Phase 1: Core Infrastructure",
    status: "completed",
    progress: 100,
    items: [
      {
        title: "DeepBook Integration",
        description:
          "Full integration with DeepBook V3 SDK for order book trading",
        status: "completed",
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        title: "ZK Proof System",
        description:
          "Plonky3-based prover for privacy-preserving intent verification",
        status: "completed",
        icon: <Shield className="h-5 w-5" />,
      },
      {
        title: "Move Smart Contracts",
        description:
          "On-chain intent registry, settlement, and ZK verification",
        status: "completed",
        icon: <Lock className="h-5 w-5" />,
      },
      {
        title: "Solver Infrastructure",
        description: "WebSocket-based solver network for intent matching",
        status: "completed",
        icon: <Zap className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Phase 2: Privacy & UX",
    status: "completed",
    progress: 100,
    items: [
      {
        title: "Encrypted Intents",
        description: "End-to-end encryption for all trading intents",
        status: "completed",
        icon: <Lock className="h-5 w-5" />,
      },
      {
        title: "3-Mode Trading UI",
        description: "Simple Swap, Advanced Trading, and Private Intent modes",
        status: "completed",
        icon: <Target className="h-5 w-5" />,
      },
      {
        title: "zkLogin Integration",
        description:
          "OAuth-based authentication with zero-knowledge identity privacy",
        status: "completed",
        icon: <Shield className="h-5 w-5" />,
      },
      {
        title: "Referral System",
        description: "On-chain referral tracking with fee sharing",
        status: "completed",
        icon: <Users className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Phase 3: Order Book Lending",
    status: "upcoming",
    progress: 15,
    items: [
      {
        title: "Lending Pool Architecture",
        description: "Design lending pools integrated with DeepBook liquidity",
        status: "in-progress",
        icon: <Coins className="h-5 w-5" />,
      },
      {
        title: "Collateral Management",
        description: "Multi-asset collateral with dynamic LTV ratios",
        status: "upcoming",
        icon: <Wallet className="h-5 w-5" />,
      },
      {
        title: "Interest Rate Model",
        description:
          "Utilization-based rates with order book depth consideration",
        status: "upcoming",
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        title: "Liquidation Engine",
        description: "DeepBook-native liquidation via limit orders",
        status: "upcoming",
        icon: <Zap className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Phase 4: Advanced Features",
    status: "upcoming",
    progress: 0,
    items: [
      {
        title: "Cross-Pool Strategies",
        description: "Arbitrage and yield optimization across pools",
        status: "upcoming",
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        title: "Automated Market Making",
        description:
          "Decentralized market making with privacy-preserving quotes",
        status: "upcoming",
        icon: <Rocket className="h-5 w-5" />,
      },
      {
        title: "Governance Token",
        description: "Protocol governance with fee sharing for stakers",
        status: "upcoming",
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "Mobile App",
        description: "Native mobile experience with zkLogin",
        status: "upcoming",
        icon: <Wallet className="h-5 w-5" />,
      },
    ],
  },
];

const statusConfig = {
  completed: {
    badge: "Completed",
    variant: "default" as const,
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
  },
  "in-progress": {
    badge: "In Progress",
    variant: "secondary" as const,
    icon: <Clock className="h-4 w-4 text-amber-500 animate-pulse" />,
  },
  upcoming: {
    badge: "Upcoming",
    variant: "outline" as const,
    icon: <Rocket className="h-4 w-4 text-slate-400" />,
  },
};

export default function RoadmapPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Product Roadmap
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Building the future of privacy-preserving DeFi on Sui. Track our
            progress and upcoming features.
          </p>
        </div>

        <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-purple-950/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-amber-400" />
              <CardTitle>Coming Soon: Order Book Lending</CardTitle>
            </div>
            <CardDescription className="text-base">
              Borrow and lend assets directly through DeepBook&apos;s order
              book. Earn yield on your idle assets while maintaining full
              control.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200">For Lenders</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• Earn interest on deposited assets</li>
                  <li>• Utilization-based dynamic rates</li>
                  <li>• Withdraw anytime with no lock-up</li>
                  <li>• Privacy-preserving positions</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200">For Borrowers</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• Borrow against collateral</li>
                  <li>• Competitive interest rates</li>
                  <li>• Order book native liquidations</li>
                  <li>• Multi-asset collateral support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {roadmapPhases.map((phase, phaseIndex) => (
            <Card key={phaseIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusConfig[phase.status].icon}
                    <CardTitle className="text-lg">{phase.title}</CardTitle>
                  </div>
                  <Badge variant={statusConfig[phase.status].variant}>
                    {statusConfig[phase.status].badge}
                  </Badge>
                </div>
                <Progress value={phase.progress} className="h-2" />
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {phase.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`p-4 rounded-lg border ${
                        item.status === "completed"
                          ? "border-green-500/20 bg-green-950/10"
                          : item.status === "in-progress"
                            ? "border-amber-500/20 bg-amber-950/10"
                            : "border-white/5 bg-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            item.status === "completed"
                              ? "bg-green-500/10 text-green-400"
                              : item.status === "in-progress"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">
                              {item.title}
                            </h4>
                            {statusConfig[item.status].icon}
                          </div>
                          <p className="text-xs text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-indigo-950/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">
                Want to contribute or suggest features?
              </h3>
              <p className="text-slate-400">
                Join our community and help shape the future of ZK-IntentBook
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href="https://github.com/vmmuthu31/ZK-IntentBook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="#"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Join Discord
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
