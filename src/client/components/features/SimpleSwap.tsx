"use client";

import { useState } from "react";
import { ArrowDownUp, Settings } from "lucide-react";
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
import { ASSET_LIST, AssetConfig } from "@/shared/constants";
import { useIntentWallet } from "@/client/hooks";

export function SimpleSwap() {
  const { connected } = useIntentWallet();
  const [fromAsset, setFromAsset] = useState<AssetConfig>(ASSET_LIST[1]);
  const [toAsset, setToAsset] = useState<AssetConfig>(ASSET_LIST[0]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");

  const handleSwapDirection = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

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
            balance="1,234.56"
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
            balance="5,678.90"
            readonly
          />
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Rate</span>
            <span className="text-white">
              1 {fromAsset.symbol} ≈ 2.45 {toAsset.symbol}
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
          className="w-full mt-6 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all"
          disabled={!connected || !fromAmount}
        >
          {!connected
            ? "Connect Wallet"
            : !fromAmount
              ? "Enter Amount"
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
  readonly?: boolean;
}

function TokenInput({
  label,
  asset,
  amount,
  onAmountChange,
  onAssetChange,
  balance,
  readonly,
}: TokenInputProps) {
  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{label}</span>
        {balance && (
          <span className="text-sm text-slate-400">
            Balance: <span className="text-white">{balance}</span>
          </span>
        )}
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
