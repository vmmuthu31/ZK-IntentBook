"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction } from "@mysten/sui/transactions";
import {
  getAllReferrals,
  createReferral,
  claimReferralFees,
  type ReferralInfo,
} from "@/server/actions/referral.actions";
import { useIntentWallet } from "./useWallet";
import { toast } from "sonner";

export function useReferrals() {
  const { address, connected, signAndExecuteTransaction } = useIntentWallet();
  const [referrals, setReferrals] = useState<ReferralInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchReferrals = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const data = await getAllReferrals(address);
      setReferrals(data);
    } catch {
      toast.error("Failed to fetch referral data");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (connected && address) {
      fetchReferrals();
    }
  }, [connected, address, fetchReferrals]);

  const createPoolReferral = async (poolId: string) => {
    if (!connected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsCreating(true);
    try {
      const { transaction: txBase64 } = await createReferral(poolId);
      const txBytes = Uint8Array.from(Buffer.from(txBase64, "base64"));
      const tx = Transaction.from(txBytes);

      await signAndExecuteTransaction(tx);

      toast.success("Referral NFT minted successfully!");
      await fetchReferrals();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create referral",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const claimFees = async (referralId: string, poolId: string) => {
    if (!connected) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsClaiming(true);
    try {
      const { transaction: txBase64 } = await claimReferralFees(
        referralId,
        poolId,
      );
      const txBytes = Uint8Array.from(Buffer.from(txBase64, "base64"));
      const tx = Transaction.from(txBytes);

      await signAndExecuteTransaction(tx);

      toast.success("Referral fees claimed!");
      await fetchReferrals();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to claim fees",
      );
    } finally {
      setIsClaiming(false);
    }
  };

  const totalEarnedFees = referrals.reduce(
    (sum, r) => sum + BigInt(r.earnedFees),
    BigInt(0),
  );

  const totalVolume = referrals.reduce(
    (sum, r) => sum + BigInt(r.totalVolume),
    BigInt(0),
  );

  return {
    referrals,
    isLoading,
    isCreating,
    isClaiming,
    createPoolReferral,
    claimFees,
    refetch: fetchReferrals,
    totalEarnedFees: totalEarnedFees.toString(),
    totalVolume: totalVolume.toString(),
  };
}
