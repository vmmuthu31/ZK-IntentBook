"use client";

import { useState, useMemo, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/shared/utils";
import { useIntentWallet } from "@/client/hooks";
import {
  Loader2,
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  ArrowRightLeft,
  Settings,
  Play,
  Pause,
  DollarSign,
} from "lucide-react";

interface MarketMakerConfig {
  id: string;
  pair: string;
  baseBalance: number;
  quoteBalance: number;
  midPrice: number;
  spreadBps: number;
  orderSize: number;
  isActive: boolean;
  totalTrades: number;
  totalVolume: number;
  totalPnL: number;
}

interface ArbitrageOpportunity {
  id: string;
  sourcePair: string;
  targetPair: string;
  profitBps: number;
  estimatedProfit: number;
  requiredCapital: number;
  timestamp: number;
}

interface CrossPoolAllocation {
  poolId: string;
  poolName: string;
  currentAllocation: number;
  targetAllocation: number;
  apy: number;
}

function MarketMakerCard({
  mm,
  onToggle,
}: {
  mm: MarketMakerConfig;
  onToggle: () => void;
}) {
  const spread = mm.spreadBps / 100;
  const bidPrice = mm.midPrice * (1 - spread / 200);
  const askPrice = mm.midPrice * (1 + spread / 200);

  return (
    <Card
      className={`bg-zinc-900/50 border-zinc-800 ${mm.isActive ? "border-green-500/30" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg">{mm.pair}</h3>
            <p className="text-xs text-zinc-500 font-mono">
              {mm.id.slice(0, 10)}...
            </p>
          </div>
          <Button
            size="sm"
            variant={mm.isActive ? "destructive" : "default"}
            onClick={onToggle}
            className="gap-1"
          >
            {mm.isActive ? (
              <>
                <Pause className="h-3 w-3" /> Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3" /> Start
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2 bg-zinc-800/50 rounded text-center">
            <p className="text-xs text-zinc-500">Bid</p>
            <p className="font-bold text-green-400">${bidPrice.toFixed(4)}</p>
          </div>
          <div className="p-2 bg-zinc-800/50 rounded text-center">
            <p className="text-xs text-zinc-500">Mid</p>
            <p className="font-bold">${mm.midPrice.toFixed(4)}</p>
          </div>
          <div className="p-2 bg-zinc-800/50 rounded text-center">
            <p className="text-xs text-zinc-500">Ask</p>
            <p className="font-bold text-red-400">${askPrice.toFixed(4)}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Spread</span>
            <span>
              {mm.spreadBps} bps ({spread.toFixed(2)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Order Size</span>
            <span>{formatNumber(mm.orderSize)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Base Balance</span>
            <span>{formatNumber(mm.baseBalance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Quote Balance</span>
            <span>${formatNumber(mm.quoteBalance)}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-zinc-500">Trades</p>
            <p className="font-bold">{mm.totalTrades}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Volume</p>
            <p className="font-bold">${formatNumber(mm.totalVolume)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">PnL</p>
            <p
              className={`font-bold ${mm.totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              ${formatNumber(mm.totalPnL)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ArbitrageMonitor({
  opportunities,
}: {
  opportunities: ArbitrageOpportunity[];
}) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Live Arbitrage Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Scanning for opportunities...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-3 bg-zinc-800/50 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded">
                    <ArrowRightLeft className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold">
                      {opp.sourcePair} → {opp.targetPair}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Required: ${formatNumber(opp.requiredCapital)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-500/20 text-green-400">
                    +{opp.profitBps} bps
                  </Badge>
                  <p className="text-sm text-green-400 font-bold mt-1">
                    +${opp.estimatedProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CrossPoolRebalancer({
  allocations,
}: {
  allocations: CrossPoolAllocation[];
}) {
  const [targetAllocations, setTargetAllocations] = useState<
    Record<string, number>
  >(() => {
    const initial: Record<string, number> = {};
    allocations.forEach((a) => {
      initial[a.poolId] = a.targetAllocation;
    });
    return initial;
  });

  const totalAllocation = Object.values(targetAllocations).reduce(
    (a, b) => a + b,
    0,
  );
  const isValid = Math.abs(totalAllocation - 100) < 0.1;

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-400" />
          Cross-Pool Allocations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allocations.map((alloc) => (
          <div key={alloc.poolId} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{alloc.poolName}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  APY: {alloc.apy.toFixed(1)}%
                </Badge>
                <span className="text-sm font-bold">
                  {targetAllocations[alloc.poolId]?.toFixed(0) || 0}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Slider
                value={[targetAllocations[alloc.poolId] || 0]}
                onValueChange={(values: number[]) => {
                  setTargetAllocations((prev) => ({
                    ...prev,
                    [alloc.poolId]: values[0],
                  }));
                }}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>

            <div className="flex justify-between text-xs text-zinc-500">
              <span>Current: {alloc.currentAllocation}%</span>
              <span
                className={
                  (targetAllocations[alloc.poolId] || 0) >
                  alloc.currentAllocation
                    ? "text-green-400"
                    : (targetAllocations[alloc.poolId] || 0) <
                        alloc.currentAllocation
                      ? "text-red-400"
                      : ""
                }
              >
                {(targetAllocations[alloc.poolId] || 0) -
                  alloc.currentAllocation >=
                0
                  ? "+"
                  : ""}
                {(
                  (targetAllocations[alloc.poolId] || 0) -
                  alloc.currentAllocation
                ).toFixed(0)}
                %
              </span>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <span className="text-zinc-400">Total Allocation</span>
            <span
              className={`font-bold ${isValid ? "text-green-400" : "text-red-400"}`}
            >
              {totalAllocation.toFixed(0)}%
            </span>
          </div>

          <Button className="w-full" disabled={!isValid}>
            {isValid ? "Apply Rebalancing" : "Allocations must equal 100%"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateMarketMaker() {
  const [pair, setPair] = useState("SUI/USDC");
  const [spreadBps, setSpreadBps] = useState(50);
  const [orderSize, setOrderSize] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-400" />
          Create Market Maker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-zinc-400 block mb-2">
            Trading Pair
          </label>
          <select
            value={pair}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setPair(e.target.value)
            }
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2"
          >
            <option value="SUI/USDC">SUI/USDC</option>
            <option value="DEEP/SUI">DEEP/SUI</option>
            <option value="WETH/USDC">WETH/USDC</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2">
            Spread: {spreadBps} bps ({(spreadBps / 100).toFixed(2)}%)
          </label>
          <Slider
            value={[spreadBps]}
            onValueChange={(values: number[]) => setSpreadBps(values[0])}
            min={5}
            max={500}
            step={5}
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>5 bps (tight)</span>
            <span>500 bps (wide)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-zinc-400 block mb-2">
              Base Amount
            </label>
            <Input
              type="number"
              placeholder="1000"
              value={baseAmount}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setBaseAmount(e.target.value)
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-2">
              Quote Amount
            </label>
            <Input
              type="number"
              placeholder="10000"
              value={quoteAmount}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setQuoteAmount(e.target.value)
              }
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2">Order Size</label>
          <Input
            type="number"
            placeholder="100"
            value={orderSize}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setOrderSize(e.target.value)
            }
            className="bg-zinc-800 border-zinc-700"
          />
        </div>

        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="text-sm text-blue-400">
            💡 Tighter spreads = more trades but less profit per trade
          </p>
        </div>

        <Button className="w-full">
          <DollarSign className="h-4 w-4 mr-2" />
          Deploy Market Maker
        </Button>
      </CardContent>
    </Card>
  );
}

const INITIAL_MARKET_MAKERS: MarketMakerConfig[] = [
  {
    id: "0xmm1234567890",
    pair: "SUI/USDC",
    baseBalance: 5000,
    quoteBalance: 20000,
    midPrice: 4.25,
    spreadBps: 30,
    orderSize: 100,
    isActive: true,
    totalTrades: 1247,
    totalVolume: 892450,
    totalPnL: 4521.32,
  },
  {
    id: "0xmm9876543210",
    pair: "DEEP/SUI",
    baseBalance: 50000,
    quoteBalance: 12500,
    midPrice: 0.25,
    spreadBps: 50,
    orderSize: 1000,
    isActive: false,
    totalTrades: 432,
    totalVolume: 125000,
    totalPnL: 892.15,
  },
];

const INITIAL_OPPORTUNITIES: ArbitrageOpportunity[] = [
  {
    id: "arb1",
    sourcePair: "SUI/USDC (DeepBook)",
    targetPair: "SUI/USDC (Cetus)",
    profitBps: 12,
    estimatedProfit: 24.5,
    requiredCapital: 20000,
    timestamp: Date.now(),
  },
];

const INITIAL_ALLOCATIONS: CrossPoolAllocation[] = [
  {
    poolId: "pool1",
    poolName: "SUI/USDC",
    currentAllocation: 40,
    targetAllocation: 40,
    apy: 12.5,
  },
  {
    poolId: "pool2",
    poolName: "DEEP/SUI",
    currentAllocation: 30,
    targetAllocation: 30,
    apy: 18.2,
  },
  {
    poolId: "pool3",
    poolName: "WETH/USDC",
    currentAllocation: 30,
    targetAllocation: 30,
    apy: 8.7,
  },
];

export function StrategyDashboard() {
  const { connected } = useIntentWallet();
  const [activeTab, setActiveTab] = useState("mm");
  const [marketMakers, setMarketMakers] = useState<MarketMakerConfig[]>(
    INITIAL_MARKET_MAKERS,
  );
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>(
    INITIAL_OPPORTUNITIES,
  );
  const allocations = useMemo(() => INITIAL_ALLOCATIONS, []);

  const toggleMM = (id: string) => {
    setMarketMakers((prev) =>
      prev.map((mm) => (mm.id === id ? { ...mm, isActive: !mm.isActive } : mm)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Strategies</h2>
          <p className="text-zinc-400">
            AMM, arbitrage, and cross-pool management
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="text-green-400 border-green-400/50"
          >
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            Live
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900/50">
          <TabsTrigger value="mm">Market Making</TabsTrigger>
          <TabsTrigger value="arb">Arbitrage</TabsTrigger>
          <TabsTrigger value="rebalance">Cross-Pool</TabsTrigger>
        </TabsList>

        <TabsContent value="mm" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                Active Market Makers
              </h3>
              {marketMakers.map((mm) => (
                <MarketMakerCard
                  key={mm.id}
                  mm={mm}
                  onToggle={() => toggleMM(mm.id)}
                />
              ))}
            </div>
            <CreateMarketMaker />
          </div>
        </TabsContent>

        <TabsContent value="arb" className="mt-4">
          <ArbitrageMonitor opportunities={opportunities} />
        </TabsContent>

        <TabsContent value="rebalance" className="mt-4">
          <div className="max-w-2xl">
            <CrossPoolRebalancer allocations={allocations} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
