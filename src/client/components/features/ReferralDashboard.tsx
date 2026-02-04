"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Coins,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle,
  Shield,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TradeRecord {
  id: string;
  timestamp: Date;
  pair: string;
  size: number;
  feeEarned: number;
  referralAddress: string;
  txHash: string;
  proofVerified: boolean;
}

function generateMockTrades(): TradeRecord[] {
  const pairs = ["SUI/USDC", "DEEP/SUI", "WETH/USDC"];
  const now = Date.now();

  return Array.from({ length: 5 }, (_, i) => ({
    id: `trade-${i}`,
    timestamp: new Date(now - i * 3600000 - Math.random() * 1800000),
    pair: pairs[Math.floor(Math.random() * pairs.length)],
    size: Math.round(100 + Math.random() * 5000),
    feeEarned: Number((0.001 + Math.random() * 0.05).toFixed(4)),
    referralAddress: `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}...${Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
    txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
    proofVerified: true,
  }));
}

export function ReferralDashboard() {
  const [trades, setTrades] = useState<TradeRecord[]>(generateMockTrades());
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setTrades(generateMockTrades());
      setIsLoading(false);
    }, 800);
  };

  const totalFees = trades.reduce((sum, t) => sum + t.feeEarned, 0);
  const totalVolume = trades.reduce((sum, t) => sum + t.size, 0);
  const tradeCount = trades.length;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shortenHash = (hash: string) =>
    `${hash.slice(0, 8)}...${hash.slice(-6)}`;

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Referral Transparency
              </CardTitle>
              <CardDescription>
                Full visibility into fee distribution & proof verification
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="border-white/10"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/20">
            <div className="flex items-center gap-2 text-sm text-green-300 mb-2">
              <Coins className="h-4 w-4" />
              Total Fees Earned
            </div>
            <div className="text-2xl font-bold text-white">
              {totalFees.toFixed(4)} DEEP
            </div>
            <div className="text-xs text-slate-400 mt-1">
              ≈ ${(totalFees * 0.15).toFixed(2)} USD
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <TrendingUp className="h-4 w-4" />
              Total Volume
            </div>
            <div className="text-2xl font-bold text-white">
              ${totalVolume.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Lifetime</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <BarChart3 className="h-4 w-4" />
              Trades Executed
            </div>
            <div className="text-2xl font-bold text-white">{tradeCount}</div>
            <div className="text-xs text-slate-400 mt-1">All time</div>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-slate-400">Pair</TableHead>
                <TableHead className="text-slate-400 text-right">
                  Volume
                </TableHead>
                <TableHead className="text-slate-400 text-right">Fee</TableHead>
                <TableHead className="text-slate-400">Referral Addr</TableHead>
                <TableHead className="text-slate-400">Proof</TableHead>
                <TableHead className="text-slate-400 text-right">Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id} className="border-white/5">
                  <TableCell className="text-slate-300 text-sm">
                    {trade.timestamp.toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/10">
                      {trade.pair}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-300">
                    ${trade.size.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-green-400 font-medium">
                    +{trade.feeEarned.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          trade.referralAddress,
                          `ref-${trade.id}`,
                        )
                      }
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors font-mono"
                    >
                      {trade.referralAddress}
                      {copiedId === `ref-${trade.id}` ? (
                        <CheckCircle className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    {trade.proofVerified ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() =>
                        copyToClipboard(trade.txHash, `tx-${trade.id}`)
                      }
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors font-mono"
                    >
                      {shortenHash(trade.txHash)}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-300 mb-1">
                Sustainable Revenue Model
              </h4>
              <p className="text-xs text-slate-400">
                Every trade executed through ZK-IntentBook generates referral
                fees via DeepBook&apos;s native referral system. Fees are
                distributed on-chain with full transparency—the referral address
                is committed in the ZK proof, ensuring verifiable and
                tamper-proof fee attribution.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
