"use client";

import { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIntentWallet } from "@/client/hooks";
import {
  getAllReferrals,
  type ReferralInfo,
} from "@/server/actions/referral.actions";
import {
  getRecentSettlements,
  type SettlementEvent,
} from "@/server/actions/solver.actions";

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

function mapSettlementsToTrades(settlements: SettlementEvent[]): TradeRecord[] {
  return settlements.map((s, i) => ({
    id: `trade-${i}`,
    timestamp: s.timestamp,
    pair: s.pair,
    size: parseFloat(s.quoteAmount) / 1e9,
    feeEarned: (parseFloat(s.quoteAmount) * 0.0001) / 1e9,
    referralAddress: s.solver,
    txHash: s.digest,
    proofVerified: s.proofVerified,
  }));
}

export function ReferralDashboard() {
  const { address } = useIntentWallet();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [settlementsData, referralData] = await Promise.all([
        getRecentSettlements(20),
        address ? getAllReferrals(address) : Promise.resolve([]),
      ]);

      setTrades(mapSettlementsToTrades(settlementsData));
      setReferrals(referralData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = () => {
    fetchData();
  };

  const totalFees = referrals.reduce(
    (sum, r) => sum + parseFloat(r.earnedFees) / 1e9,
    0,
  );
  const totalVolume = referrals.reduce(
    (sum, r) => sum + parseFloat(r.totalVolume) / 1e9,
    0,
  );
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

        {error && (
          <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {!address && (
          <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400" />
            <p className="text-sm text-blue-300">
              Connect wallet to view your personal referral statistics
            </p>
          </div>
        )}

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

        <div className="p-4 rounded-xl bg-linear-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20">
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
