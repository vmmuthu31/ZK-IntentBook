"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchLendingPoolsAction,
  fetchUserPositionsAction,
  simulateBorrowAction,
  type ActionResult,
} from "@/server/actions/lending.actions";
import type {
  LendingPoolInfo,
  LendingPosition,
} from "@/server/services/lending.service";
import { useIntentWallet } from "@/client/hooks";
import { formatNumber } from "@/shared/utils";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Coins,
  Percent,
} from "lucide-react";

function HealthIndicator({ health }: { health: number }) {
  const getColor = () => {
    if (health >= 2) return "text-green-400";
    if (health >= 1.5) return "text-yellow-400";
    if (health >= 1.1) return "text-orange-400";
    return "text-red-400";
  };

  const getLabel = () => {
    if (health >= 2) return "Safe";
    if (health >= 1.5) return "Moderate";
    if (health >= 1.1) return "At Risk";
    return "Liquidatable";
  };

  return (
    <div className={`flex items-center gap-2 ${getColor()}`}>
      {health < 1.5 ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Shield className="h-4 w-4" />
      )}
      <span className="font-bold">
        {health === Infinity ? "∞" : health.toFixed(2)}
      </span>
      <Badge
        variant={health >= 1.5 ? "secondary" : "destructive"}
        className="text-xs"
      >
        {getLabel()}
      </Badge>
    </div>
  );
}

function PoolCard({
  pool,
  onSelect,
}: {
  pool: LendingPoolInfo;
  onSelect: () => void;
}) {
  return (
    <Card
      className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg">
              {pool.baseAsset}/{pool.quoteAsset}
            </h3>
            <p className="text-sm text-slate-400">Lending Pool</p>
          </div>
          <Badge variant="outline" className="text-cyan-400 border-cyan-400/50">
            {pool.utilizationRate.toFixed(1)}% Utilized
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Supply APR
            </p>
            <p className="text-lg font-bold text-green-400">
              {pool.supplyAPR.toFixed(2)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Borrow APR
            </p>
            <p className="text-lg font-bold text-orange-400">
              {pool.borrowAPR.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800">
          <div className="text-sm">
            <span className="text-slate-400">LTV: </span>
            <span className="text-white">{pool.ltvRatio}%</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-400">Liq. Threshold: </span>
            <span className="text-white">{pool.liquidationThreshold}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PositionCard({
  position,
  pool,
}: {
  position: LendingPosition;
  pool?: LendingPoolInfo;
}) {
  const collateralValue = Number(position.baseDeposited) / 1e9;
  const debtValue = Number(position.quoteBorrowed) / 1e6;

  return (
    <Card
      className={`bg-slate-900/50 border-slate-800 ${position.healthFactor < 1.5 ? "border-orange-500/50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold">
              {pool?.baseAsset || "Unknown"}/{pool?.quoteAsset || "USDC"}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {position.positionId.slice(0, 10)}...
            </p>
          </div>
          <HealthIndicator health={position.healthFactor} />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Collateral</p>
            <p className="font-bold">
              {formatNumber(collateralValue)} {pool?.baseAsset || "?"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Borrowed</p>
            <p className="font-bold">
              {formatNumber(debtValue)} {pool?.quoteAsset || "USDC"}
            </p>
          </div>
        </div>

        {position.healthFactor < 1.5 && (
          <div className="mt-3 p-2 bg-orange-500/10 rounded border border-orange-500/30">
            <p className="text-xs text-orange-400">
              ⚠️ Liquidation at ${position.liquidationPrice.toFixed(4)}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1">
            Deposit More
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            Repay
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BorrowSimulator({ pools }: { pools: LendingPoolInfo[] }) {
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [collateralAmount, setCollateralAmount] = useState<string>("");
  const [borrowAmount, setBorrowAmount] = useState<string>("");
  const [simulation, setSimulation] = useState<{
    healthFactor: number;
    liquidationPrice: number;
    monthlyInterest: number;
    annualInterest: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const pool = pools.find((p) => p.poolId === selectedPool);

  const runSimulation = useCallback(async () => {
    if (!selectedPool || !collateralAmount || !borrowAmount) return;

    setLoading(true);
    const result = await simulateBorrowAction({
      poolId: selectedPool,
      borrowAmount: parseFloat(borrowAmount),
      collateralAmount: parseFloat(collateralAmount),
    });

    if (result.success) {
      setSimulation(result.data);
    }
    setLoading(false);
  }, [selectedPool, collateralAmount, borrowAmount]);

  useEffect(() => {
    const timer = setTimeout(runSimulation, 500);
    return () => clearTimeout(timer);
  }, [runSimulation]);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-cyan-400" />
          Borrow Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 block mb-2">
            Select Pool
          </label>
          <select
            value={selectedPool}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSelectedPool(e.target.value)
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
          >
            <option value="">Select a pool</option>
            {pools.map((p) => (
              <option key={p.poolId} value={p.poolId}>
                {p.baseAsset}/{p.quoteAsset} - {p.borrowAPR.toFixed(2)}% APR
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 block mb-2">
              Collateral ({pool?.baseAsset || "Base"})
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={collateralAmount}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCollateralAmount(e.target.value)
              }
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2">
              Borrow ({pool?.quoteAsset || "Quote"})
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={borrowAmount}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setBorrowAmount(e.target.value)
              }
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        {pool && collateralAmount && (
          <div className="text-sm text-slate-400">
            Max borrowable:{" "}
            <span className="text-white font-bold">
              {(parseFloat(collateralAmount) * (pool.ltvRatio / 100)).toFixed(
                2,
              )}{" "}
              {pool.quoteAsset}
            </span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        )}

        {simulation && !loading && (
          <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Health Factor</span>
              <HealthIndicator health={simulation.healthFactor} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Liquidation Price</span>
              <span className="font-bold">
                ${simulation.liquidationPrice.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Monthly Interest</span>
              <span className="font-bold text-orange-400">
                ${simulation.monthlyInterest.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Annual Interest</span>
              <span className="font-bold text-orange-400">
                ${simulation.annualInterest.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InterestRateChart({ pool }: { pool: LendingPoolInfo }) {
  const utilizations = Array.from({ length: 21 }, (_, i) => i * 5);
  const optimalUtil = 80;
  const baseRate = 2;
  const multiplier = 10;
  const jumpMultiplier = 100;

  const rates = utilizations.map((util) => {
    if (util <= optimalUtil) {
      return baseRate + (util / optimalUtil) * multiplier;
    }
    const normalRate = baseRate + multiplier;
    const excessUtil = util - optimalUtil;
    const maxExcess = 100 - optimalUtil;
    return normalRate + (excessUtil / maxExcess) * jumpMultiplier;
  });

  const maxRate = Math.max(...rates);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-cyan-400" />
          Interest Rate Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-48">
          <div className="absolute inset-0 flex items-end">
            {utilizations.map((util, i) => (
              <div
                key={util}
                className="flex-1 flex flex-col items-center justify-end"
              >
                <div
                  className={`w-full mx-px rounded-t ${
                    util <= optimalUtil ? "bg-blue-500" : "bg-orange-500"
                  }`}
                  style={{
                    height: `${(rates[i] / maxRate) * 100}%`,
                  }}
                />
              </div>
            ))}
          </div>

          <div
            className="absolute top-0 bottom-0 border-l-2 border-dashed border-green-400"
            style={{ left: `${optimalUtil}%` }}
          >
            <span className="absolute -top-6 left-1 text-xs text-green-400">
              Optimal ({optimalUtil}%)
            </span>
          </div>

          <div
            className="absolute border-l-2 border-yellow-400 top-0 bottom-0"
            style={{ left: `${pool.utilizationRate}%` }}
          >
            <span className="absolute -top-6 right-1 text-xs text-yellow-400">
              Current
            </span>
          </div>
        </div>

        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        <div className="flex justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-slate-400">Normal Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span className="text-slate-400">Jump Rate</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LendingDashboard() {
  const { address, connected } = useIntentWallet();
  const [pools, setPools] = useState<LendingPoolInfo[]>([]);
  const [positions, setPositions] = useState<LendingPosition[]>([]);
  const [selectedPool, setSelectedPool] = useState<LendingPoolInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pools");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const poolsResult = await fetchLendingPoolsAction();
      if (poolsResult.success) {
        setPools(poolsResult.data);
      }

      if (address) {
        const positionsResult = await fetchUserPositionsAction(address);
        if (positionsResult.success) {
          setPositions(positionsResult.data);
        }
      }

      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [address]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order Book Lending</h2>
          <p className="text-slate-400">
            Borrow against your assets using DeepBook liquidity
          </p>
        </div>
        {positions.some((p) => p.healthFactor < 1.5) && (
          <Badge variant="destructive" className="animate-pulse">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Position at risk
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/50">
          <TabsTrigger value="pools">Lending Pools</TabsTrigger>
          <TabsTrigger value="positions">
            My Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="simulator">Simulator</TabsTrigger>
        </TabsList>

        <TabsContent value="pools" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pools.map((pool) => (
              <PoolCard
                key={pool.poolId}
                pool={pool}
                onSelect={() => setSelectedPool(pool)}
              />
            ))}
          </div>

          {selectedPool && <InterestRateChart pool={selectedPool} />}
        </TabsContent>

        <TabsContent value="positions" className="space-y-4 mt-4">
          {!connected ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">
                  Connect wallet to view positions
                </p>
              </CardContent>
            </Card>
          ) : positions.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">No active lending positions</p>
                <Button className="mt-4" onClick={() => setActiveTab("pools")}>
                  Browse Pools
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {positions.map((position) => (
                <PositionCard
                  key={position.positionId}
                  position={position}
                  pool={pools.find((p) => p.poolId === position.poolId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="simulator" className="mt-4">
          <BorrowSimulator pools={pools} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
