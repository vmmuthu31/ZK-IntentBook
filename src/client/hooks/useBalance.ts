"use client";

import { useState, useEffect, useCallback } from "react";
import { useIntentWallet } from "./useWallet";
import { ASSET_LIST, AssetConfig } from "@/shared/constants";

interface BalanceInfo {
  raw: bigint;
  formatted: string;
  loading: boolean;
}

type Balances = Record<string, BalanceInfo>;

const SUI_RPC_URL =
  process.env.NEXT_PUBLIC_SUI_RPC_URL || "https://fullnode.testnet.sui.io:443";

async function fetchCoinBalance(
  address: string,
  coinType: string,
): Promise<bigint> {
  const response = await fetch(SUI_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "suix_getBalance",
      params: [address, coinType],
    }),
  });

  const data = await response.json();
  if (data.result?.totalBalance) {
    return BigInt(data.result.totalBalance);
  }
  return BigInt(0);
}

function formatBalance(raw: bigint, decimals: number): string {
  if (raw === BigInt(0)) return "0.00";

  const divisor = BigInt(10 ** decimals);
  const integerPart = raw / divisor;
  const fractionalPart = raw % divisor;

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const significantFractional = fractionalStr.slice(0, 4).replace(/0+$/, "");

  const integerFormatted = integerPart.toLocaleString();

  if (significantFractional) {
    return `${integerFormatted}.${significantFractional}`;
  }
  return integerFormatted;
}

export function useBalance(asset?: AssetConfig) {
  const { address, connected } = useIntentWallet();
  const [balance, setBalance] = useState<BalanceInfo>({
    raw: BigInt(0),
    formatted: "0.00",
    loading: false,
  });

  const fetchBalance = useCallback(async () => {
    if (!connected || !address || !asset) {
      setBalance({ raw: BigInt(0), formatted: "0.00", loading: false });
      return;
    }

    setBalance((prev) => ({ ...prev, loading: true }));

    try {
      const raw = await fetchCoinBalance(address, asset.type);
      const formatted = formatBalance(raw, asset.decimals);
      setBalance({ raw, formatted, loading: false });
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance({ raw: BigInt(0), formatted: "0.00", loading: false });
    }
  }, [address, connected, asset]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { ...balance, refetch: fetchBalance };
}

export function useAllBalances() {
  const { address, connected } = useIntentWallet();
  const [balances, setBalances] = useState<Balances>({});
  const [loading, setLoading] = useState(false);

  const fetchAllBalances = useCallback(async () => {
    if (!connected || !address) {
      setBalances({});
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.all(
        ASSET_LIST.map(async (asset) => {
          try {
            const raw = await fetchCoinBalance(address, asset.type);
            return {
              symbol: asset.symbol,
              balance: {
                raw,
                formatted: formatBalance(raw, asset.decimals),
                loading: false,
              },
            };
          } catch {
            return {
              symbol: asset.symbol,
              balance: { raw: BigInt(0), formatted: "0.00", loading: false },
            };
          }
        }),
      );

      const newBalances: Balances = {};
      results.forEach(({ symbol, balance }) => {
        newBalances[symbol] = balance;
      });

      setBalances(newBalances);
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    } finally {
      setLoading(false);
    }
  }, [address, connected]);

  useEffect(() => {
    fetchAllBalances();
    const interval = setInterval(fetchAllBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchAllBalances]);

  const getBalance = (symbol: string): BalanceInfo => {
    return balances[symbol] || { raw: BigInt(0), formatted: "0.00", loading };
  };

  return { balances, loading, refetch: fetchAllBalances, getBalance };
}
