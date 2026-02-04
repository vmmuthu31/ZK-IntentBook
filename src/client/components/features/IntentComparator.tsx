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
import { Slider } from "@/components/ui/slider";
import {
  Eye,
  EyeOff,
  TrendingDown,
  Shield,
  AlertTriangle,
  Check,
  X,
  Zap,
  Lock,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonMetrics {
  expectedPrice: number;
  finalPrice: number;
  slippage: number;
  mevLoss: number;
  frontRunRisk: boolean;
  executionTime: number;
  priceProtected: boolean;
}

function generatePublicMetrics(tradeSize: number): ComparisonMetrics {
  const baseSlippage = 0.1 + (tradeSize / 10000) * 0.5;
  const mevLoss = tradeSize > 500 ? tradeSize * 0.02 : 0;
  const expectedPrice = 1.234;
  const priceImpact = baseSlippage / 100;

  return {
    expectedPrice,
    finalPrice: expectedPrice * (1 - priceImpact),
    slippage: baseSlippage,
    mevLoss,
    frontRunRisk: tradeSize > 200,
    executionTime: 150 + Math.random() * 100,
    priceProtected: false,
  };
}

function generatePrivateMetrics(tradeSize: number): ComparisonMetrics {
  const baseSlippage = 0.02 + (tradeSize / 10000) * 0.08;
  const expectedPrice = 1.234;

  return {
    expectedPrice,
    finalPrice: expectedPrice * (1 - baseSlippage / 100),
    slippage: baseSlippage,
    mevLoss: 0,
    frontRunRisk: false,
    executionTime: 280 + Math.random() * 50,
    priceProtected: true,
  };
}

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
  const [publicMetrics, setPublicMetrics] = useState<ComparisonMetrics | null>(
    null,
  );
  const [privateMetrics, setPrivateMetrics] =
    useState<ComparisonMetrics | null>(null);
  const [comparisonKey, setComparisonKey] = useState(0);

  const isComparing = publicMetrics === null || privateMetrics === null;

  useEffect(() => {
    const timer0 = setTimeout(() => {
      setPublicMetrics(null);
      setPrivateMetrics(null);
    }, 0);

    const timer1 = setTimeout(() => {
      setPublicMetrics(generatePublicMetrics(tradeSize));
    }, 600);

    const timer2 = setTimeout(() => {
      setPrivateMetrics(generatePrivateMetrics(tradeSize));
    }, 1200);

    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [tradeSize, comparisonKey]);

  const runComparison = () => {
    setComparisonKey((prev) => prev + 1);
  };

  const savings =
    publicMetrics && privateMetrics
      ? publicMetrics.mevLoss +
        (publicMetrics.slippage - privateMetrics.slippage) * (tradeSize / 100)
      : 0;

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Public vs Private Comparison
              </CardTitle>
              <CardDescription>
                See exactly what you save with ZK-IntentBook
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            Live Analysis
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Trade Size</span>
            <span className="text-lg font-bold text-white">
              ${tradeSize.toLocaleString()} USDC
            </span>
          </div>
          <Slider
            value={[tradeSize]}
            onValueChange={([v]) => setTradeSize(v)}
            min={100}
            max={10000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between mt-1 text-xs text-slate-500">
            <span>$100</span>
            <span>$10,000</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-5 w-5 text-red-400" />
              <span className="font-semibold text-red-400">
                Public DeepBook Order
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
                label="Expected Price"
                publicValue={`$${publicMetrics.expectedPrice.toFixed(4)}`}
                privateValue={`$${privateMetrics.expectedPrice.toFixed(4)}`}
              />
              <MetricRow
                label="Final Price"
                publicValue={`$${publicMetrics.finalPrice.toFixed(4)}`}
                privateValue={`$${privateMetrics.finalPrice.toFixed(4)}`}
                publicBad
                privateGood
              />
              <MetricRow
                label="Slippage"
                publicValue={`${publicMetrics.slippage.toFixed(2)}%`}
                privateValue={`${privateMetrics.slippage.toFixed(2)}%`}
                publicBad
                privateGood
              />
              <MetricRow
                label="MEV Loss"
                publicValue={
                  publicMetrics.mevLoss > 0 ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />$
                      {publicMetrics.mevLoss.toFixed(2)}
                    </span>
                  ) : (
                    "$0.00"
                  )
                }
                privateValue="$0.00"
                publicBad={publicMetrics.mevLoss > 0}
                privateGood
              />
              <MetricRow
                label="Front-Run Risk"
                publicValue={
                  publicMetrics.frontRunRisk ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      High
                    </span>
                  ) : (
                    "Low"
                  )
                }
                privateValue={
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Protected
                  </span>
                }
                publicBad={publicMetrics.frontRunRisk}
                privateGood
              />
            </div>

            {savings > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30">
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
                      Protection Rate
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      {(
                        ((publicMetrics.slippage - privateMetrics.slippage) /
                          publicMetrics.slippage) *
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
          disabled={isComparing}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
        >
          {isComparing ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Re-run Comparison
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
