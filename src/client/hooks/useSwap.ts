"use client";

import { useState, useCallback } from "react";
import {
  buildSwapTransaction,
  estimateSwapOutput,
} from "@/server/actions/swap.actions";
import { useIntentWallet } from "./useWallet";
import { Transaction } from "@mysten/sui/transactions";

interface SwapParams {
  poolId: string;
  isBid: boolean;
  baseAmount: string;
  quoteAmount: string;
  slippageBps?: number;
}

interface UseSwapReturn {
  executeSwap: (
    params: SwapParams,
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  estimateOutput: (
    params: SwapParams,
  ) => Promise<{ success: boolean; estimatedOutput?: string; error?: string }>;
  loading: boolean;
  error: string | null;
}

export function useSwap(): UseSwapReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useIntentWallet();

  const estimateOutput = useCallback(async (params: SwapParams) => {
    try {
      setError(null);
      const result = await estimateSwapOutput(params);

      if (!result.success) {
        setError(result.error || "Failed to estimate output");
        return { success: false, error: result.error };
      }

      return {
        success: true,
        estimatedOutput: result.data?.estimatedOutput,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const executeSwap = useCallback(
    async (params: SwapParams) => {
      if (!wallet.connected) {
        const errorMsg = "Wallet not connected";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      try {
        setLoading(true);
        setError(null);

        const txResult = await buildSwapTransaction(params);

        if (!txResult.success || !txResult.data) {
          setError(txResult.error || "Failed to build transaction");
          return { success: false, error: txResult.error };
        }

        const txBytes = new Uint8Array(txResult.data.transaction);
        const tx = Transaction.from(txBytes);

        const result = await wallet.signAndExecuteTransaction(tx);

        return {
          success: true,
          txHash: result.digest,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [wallet],
  );

  return {
    executeSwap,
    estimateOutput,
    loading,
    error,
  };
}
