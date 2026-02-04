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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  Check,
  X,
  Zap,
  Lock,
  Sparkles,
  RefreshCw,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  analyzePublicTrade,
  analyzePrivateTrade,
  type TradeAnalysis,
  type PrivateTradeAnalysis,
} from "@/server/actions/analysis.actions";
import { POOLS } from "@/shared/constants/pools";

interface MetricRowProps {
  label: string;
  publicValue: React.ReactNode;
  privateValue: React.ReactNode;
  publicBad?: boolean;
  privateGood?: boolean;
}

function MetricRow({
  label,
  publicValue,
  privateValue,
  publicBad,
  privateGood,
}: MetricRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="text-slate-400 text-sm">{label}</div>
      <div
        className={cn(
          "text-sm font-medium",
          publicBad ? "text-red-400" : "text-slate-300",
        )}
      >
        {publicValue}
      </div>
      <div
        className={cn(
          "text-sm font-medium",
          privateGood ? "text-green-400" : "text-slate-300",
        )}
      >
        {privateValue}
      </div>
    </div>
  );
}

export function IntentComparator() {
  const [tradeSize, setTradeSize] = useState(1000);
  const [selectedPool, setSelectedPool] = useState("SUI_USDC");
  const [isBuy, setIsBuy] = useState(true);
  const [publicMetrics, setPublicMetrics] = useState<TradeAnalysis | null>(
    null,
  );
  const [privateMetrics, setPrivateMetrics] =
    useState<PrivateTradeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);

  const runComparison = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [publicResult, privateResult] = await Promise.all([
        analyzePublicTrade(selectedPool, tradeSize, isBuy),
        analyzePrivateTrade(selectedPool, tradeSize, isBuy),
      ]);

      if (publicResult.success && publicResult.data) {
        setPublicMetrics(publicResult.data);
      } else {
        setError(publicResult.error || "Failed to analyze public trade");
      }

      if (privateResult.success && privateResult.data) {
        setPrivateMetrics(privateResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPool, tradeSize, isBuy]);

  useEffect(() => {
    runComparison();
  }, [runComparison]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(runComparison, 10000);
    return () => clearInterval(interval);
  }, [isLive, runComparison]);

  const savings = privateMetrics?.savingsEstimate || 0;

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Public vs Private Comparison
              </CardTitle>
              <CardDescription>
                Real-time analysis from DeepBook order book
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "cursor-pointer",
                isLive
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-slate-500/20 text-slate-400",
              )}
              onClick={() => setIsLive(!isLive)}
            >
              <Activity
                className={cn("h-3 w-3 mr-1", isLive && "animate-pulse")}
              />
              {isLive ? "Live" : "Paused"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Pool</label>
            <Select value={selectedPool} onValueChange={setSelectedPool}>
              <SelectTrigger className="bg-slate-800/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                {Object.entries(POOLS).map(([key, pool]) => (
                  <SelectItem key={key} value={key}>
                    {pool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Direction
            </label>
            <div className="flex bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setIsBuy(true)}
                className={cn(
                  "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                  isBuy ? "bg-green-600 text-white" : "text-slate-400",
                )}
              >
                Buy
              </button>
              <button
                onClick={() => setIsBuy(false)}
                className={cn(
                  "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                  !isBuy ? "bg-red-600 text-white" : "text-slate-400",
                )}
              >
                Sell
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Trade Size</span>
            <span className="text-lg font-bold text-white">
              ${tradeSize.toLocaleString()}
            </span>
          </div>
          <Slider
            value={[tradeSize]}
            onValueChange={([v]) => setTradeSize(v)}
            min={100}
            max={50000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between mt-1 text-xs text-slate-500">
            <span>$100</span>
            <span>$50,000</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-5 w-5 text-red-400" />
              <span className="font-semibold text-red-400">
                Public DeepBook
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-red-400" />
                <span className="text-slate-300">Price visible to all</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-red-400" />
                <span className="text-slate-300">Front-running possible</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-red-400" />
                <span className="text-slate-300">MEV extraction risk</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3">
              <EyeOff className="h-5 w-5 text-green-400" />
              <span className="font-semibold text-green-400">
                ZK-IntentBook
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-slate-300">Intent encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-slate-300">Solver competition</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-slate-300">ZK-verified execution</span>
              </div>
            </div>
          </div>
        </div>

        {publicMetrics && privateMetrics && (
          <>
            <div className="rounded-xl bg-slate-800/50 p-4">
              <div className="grid grid-cols-3 gap-4 pb-3 border-b border-white/10 mb-2">
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Metric
                </div>
                <div className="text-xs text-red-400 uppercase tracking-wide flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Public
                </div>
                <div className="text-xs text-green-400 uppercase tracking-wide flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </div>
              </div>

              <MetricRow
                label="Mid Price"
                publicValue={`$${publicMetrics.expectedPrice.toFixed(4)}`}
                privateValue={`$${privateMetrics.expectedPrice.toFixed(4)}`}
              />
              <MetricRow
                label="Spread"
                publicValue={`$${publicMetrics.spread.toFixed(6)}`}
                privateValue={`$${privateMetrics.spread.toFixed(6)}`}
              />
              <MetricRow
                label="Est. Slippage"
                publicValue={`${publicMetrics.estimatedSlippage.toFixed(3)}%`}
                privateValue={`${privateMetrics.estimatedSlippage.toFixed(3)}%`}
                publicBad
                privateGood
              />
              <MetricRow
                label="Price Impact"
                publicValue={`${publicMetrics.priceImpact.toFixed(3)}%`}
                privateValue={`${privateMetrics.priceImpact.toFixed(3)}%`}
                publicBad={publicMetrics.priceImpact > 0.1}
                privateGood
              />
              <MetricRow
                label="MEV Risk"
                publicValue={
                  publicMetrics.estimatedMevRisk > 0 ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />$
                      {publicMetrics.estimatedMevRisk.toFixed(2)}
                    </span>
                  ) : (
                    "$0.00"
                  )
                }
                privateValue="$0.00"
                publicBad={publicMetrics.estimatedMevRisk > 0}
                privateGood
              />
              <MetricRow
                label="Book Depth"
                publicValue={`$${(publicMetrics.depth.bids + publicMetrics.depth.asks).toLocaleString()}`}
                privateValue={
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Protected
                  </span>
                }
                privateGood
              />
            </div>

            {savings > 0 && (
              <div className="p-4 rounded-xl bg-linear-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-300 mb-1">
                      Estimated Savings with ZK-IntentBook
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      ${savings.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-1">
                      Slippage Reduction
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      {(
                        ((publicMetrics.estimatedSlippage -
                          privateMetrics.estimatedSlippage) /
                          Math.max(publicMetrics.estimatedSlippage, 0.001)) *
                        100
                      ).toFixed(0)}
                      % Better
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <Button
          onClick={runComparison}
          disabled={isLoading}
          className="w-full bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Fetching Live Data...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Refresh Analysis
            </>
          )}
        </Button>

        <div className="text-xs text-center text-slate-500">
          Data from DeepBook V3 • Updates every 10s when live
        </div>
      </CardContent>
    </Card>
  );
}
