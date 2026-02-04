"use client";

import { useState, useEffect } from "react";
import { ArrowDownUp, Settings, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSET_LIST, AssetConfig, POOL_LIST } from "@/shared/constants";
import { useIntentWallet, useAllBalances } from "@/client/hooks";
import { DEEPBOOK_INDEXER_URL } from "@/shared/constants/pools";

interface PoolData {
  pool_id: string;
  pool_name: string;
  base_asset_symbol: string;
  quote_asset_symbol: string;
}

export function SimpleSwap() {
  const { connected } = useIntentWallet();
  const { getBalance, loading: balancesLoading } = useAllBalances();
  const [fromAsset, setFromAsset] = useState<AssetConfig>(ASSET_LIST[0]);
  const [toAsset, setToAsset] = useState<AssetConfig>(
    ASSET_LIST[1] || ASSET_LIST[0],
  );
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [rate, setRate] = useState<string | null>(null);
  const [poolData, setPoolData] = useState<PoolData[]>([]);
  const [loadingRate, setLoadingRate] = useState(false);

  useEffect(() => {
    async function fetchPools() {
      try {
        const response = await fetch(`${DEEPBOOK_INDEXER_URL}/get_pools`);
        const data = await response.json();
        setPoolData(data);
      } catch (error) {
        console.error("Failed to fetch pools:", error);
      }
    }
    fetchPools();
  }, []);

  useEffect(() => {
    async function fetchRate() {
      if (!fromAsset || !toAsset || fromAsset.symbol === toAsset.symbol) {
        setRate(null);
        return;
      }

      const poolName = `${fromAsset.symbol}_${toAsset.symbol}`;
      const reversePoolName = `${toAsset.symbol}_${fromAsset.symbol}`;

      const pool =
        poolData.find((p) => p.pool_name === poolName) ||
        poolData.find((p) => p.pool_name === reversePoolName);

      if (!pool) {
        setRate(null);
        return;
      }

      setLoadingRate(true);
      try {
        const response = await fetch(
          `${DEEPBOOK_INDEXER_URL}/get_net_price/${pool.pool_id}`,
        );
        const data = await response.json();
        const price = parseFloat(data.mid_price || data.price || "0");

        if (pool.pool_name === reversePoolName && price > 0) {
          setRate((1 / price).toFixed(6));
        } else {
          setRate(price.toFixed(6));
        }
      } catch {
        setRate(null);
      } finally {
        setLoadingRate(false);
      }
    }
    fetchRate();
  }, [fromAsset, toAsset, poolData]);

  useEffect(() => {
    if (fromAmount && rate) {
      const calculated = parseFloat(fromAmount) * parseFloat(rate);
      setToAmount(calculated.toFixed(6));
    } else {
      setToAmount("");
    }
  }, [fromAmount, rate]);

  const handleSwapDirection = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const fromBalance = getBalance(fromAsset.symbol);
  const toBalance = getBalance(toAsset.symbol);

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Swap</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-2">
          <TokenInput
            label="From"
            asset={fromAsset}
            amount={fromAmount}
            onAmountChange={setFromAmount}
            onAssetChange={setFromAsset}
            balance={fromBalance.formatted}
            balanceLoading={balancesLoading || fromBalance.loading}
          />

          <div className="flex justify-center -my-2 relative z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapDirection}
              className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 hover:bg-slate-700 hover:border-indigo-500/50 transition-all"
            >
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </div>

          <TokenInput
            label="To"
            asset={toAsset}
            amount={toAmount}
            onAmountChange={setToAmount}
            onAssetChange={setToAsset}
            balance={toBalance.formatted}
            balanceLoading={balancesLoading || toBalance.loading}
            readonly
          />
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Rate</span>
            <span className="text-white">
              {loadingRate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : rate ? (
                `1 ${fromAsset.symbol} ≈ ${rate} ${toAsset.symbol}`
              ) : (
                "No pool available"
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-400">Slippage</span>
            <span className="text-white">{slippage}%</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-400">Fee</span>
            <span className="text-white">~0.1%</span>
          </div>
        </div>

        <Button
          className="w-full mt-6 h-12 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all"
          disabled={!connected || !fromAmount || !rate}
        >
          {!connected
            ? "Connect Wallet"
            : !fromAmount
              ? "Enter Amount"
              : !rate
                ? "No Pool Available"
                : "Swap"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface TokenInputProps {
  label: string;
  asset: AssetConfig;
  amount: string;
  onAmountChange: (value: string) => void;
  onAssetChange: (asset: AssetConfig) => void;
  balance?: string;
  balanceLoading?: boolean;
  readonly?: boolean;
}

function TokenInput({
  label,
  asset,
  amount,
  onAmountChange,
  onAssetChange,
  balance,
  balanceLoading,
  readonly,
}: TokenInputProps) {
  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-sm text-slate-400">
          Balance:{" "}
          {balanceLoading ? (
            <Loader2 className="inline h-3 w-3 animate-spin" />
          ) : (
            <span className="text-white">{balance || "0.00"}</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          readOnly={readonly}
          className="flex-1 bg-transparent border-0 text-2xl font-medium text-white placeholder:text-slate-600 focus-visible:ring-0 p-0 h-auto"
        />
        <Select
          value={asset.symbol}
          onValueChange={(symbol) => {
            const newAsset = ASSET_LIST.find((a) => a.symbol === symbol);
            if (newAsset) onAssetChange(newAsset);
          }}
        >
          <SelectTrigger className="w-[130px] bg-slate-700/50 border-white/10 rounded-xl">
            <SelectValue>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                  {asset.symbol[0]}
                </div>
                <span>{asset.symbol}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/10">
            {ASSET_LIST.map((a) => (
              <SelectItem key={a.symbol} value={a.symbol}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                    {a.symbol[0]}
                  </div>
                  <span>{a.symbol}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
