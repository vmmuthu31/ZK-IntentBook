"use client";

import { useWallet } from "@suiet/wallet-kit";
import { useMemo, useCallback } from "react";
import { Transaction } from "@mysten/sui/transactions";

export function useIntentWallet() {
  const wallet = useWallet();

  const signIntent = useCallback(
    async (intentHash: string): Promise<string> => {
      if (!wallet.connected || !wallet.account) {
        throw new Error("Wallet not connected");
      }

      const messageBytes = new TextEncoder().encode(intentHash);
      const result = await wallet.signPersonalMessage({
        message: messageBytes,
      });
      return result.signature;
    },
    [wallet],
  );

  const signAndExecuteTransaction = useCallback(
    async (tx: Transaction) => {
      if (!wallet.connected) {
        throw new Error("Wallet not connected");
      }

      return wallet.signAndExecuteTransaction({
        transaction: tx,
      });
    },
    [wallet],
  );

  const walletInfo = useMemo(
    () => ({
      connected: wallet.connected,
      connecting: wallet.connecting,
      address: wallet.account?.address,
      name: wallet.name,
      chain: wallet.chain,
    }),
    [
      wallet.connected,
      wallet.connecting,
      wallet.account?.address,
      wallet.name,
      wallet.chain,
    ],
  );

  return {
    ...walletInfo,
    connect: wallet.select,
    disconnect: wallet.disconnect,
    signIntent,
    signAndExecuteTransaction,
    allAvailableWallets: wallet.allAvailableWallets,
    configuredWallets: wallet.configuredWallets,
  };
}
