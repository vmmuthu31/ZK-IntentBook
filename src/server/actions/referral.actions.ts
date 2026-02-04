"use server";

import { Transaction } from "@mysten/sui/transactions";
import { getSuiClient } from "../config/sui";
import { DEEPBOOK_PACKAGE_ID, NETWORK, POOLS } from "@/shared/constants/pools";

const suiClient = getSuiClient();

const BALANCE_MANAGER_PACKAGE =
  NETWORK === "mainnet"
    ? "0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963c8e8b5eb548dee4ca"
    : "0xcbf4748a965d469ea3a36cf0ccc5743b96c2d0ae6dee0762ed3eca65fac07f7e";

export interface ReferralInfo {
  poolId: string;
  referralId: string | null;
  totalVolume: string;
  earnedFees: string;
}

export async function createReferral(poolId: string): Promise<{
  transaction: string;
  poolId: string;
}> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${DEEPBOOK_PACKAGE_ID}::pool::mint_pool_referral`,
    arguments: [tx.object(poolId)],
  });

  const serialized = await tx.build({ client: suiClient });

  return {
    transaction: Buffer.from(serialized).toString("base64"),
    poolId,
  };
}

export async function getReferralInfo(
  userAddress: string,
  poolId: string,
): Promise<ReferralInfo> {
  const referrals = await suiClient.getOwnedObjects({
    owner: userAddress,
    filter: {
      StructType: `${DEEPBOOK_PACKAGE_ID}::pool::DeepBookPoolReferral`,
    },
    options: { showContent: true },
  });

  interface ReferralContent {
    fields: {
      pool_id: string;
      total_volume: string;
      earned_fees: string;
    };
  }

  type OwnedObject = (typeof referrals.data)[number];

  const matchingReferral = referrals.data.find((obj: OwnedObject) => {
    const content = obj.data?.content;
    if (content && "fields" in content) {
      const fields = content as unknown as ReferralContent;
      return fields.fields.pool_id === poolId;
    }
    return false;
  });

  if (!matchingReferral) {
    return {
      poolId,
      referralId: null,
      totalVolume: "0",
      earnedFees: "0",
    };
  }

  const content = matchingReferral.data?.content;
  if (content && "fields" in content) {
    const fields = content as unknown as ReferralContent;
    return {
      poolId,
      referralId: matchingReferral.data?.objectId || null,
      totalVolume: fields.fields.total_volume || "0",
      earnedFees: fields.fields.earned_fees || "0",
    };
  }

  return {
    poolId,
    referralId: matchingReferral.data?.objectId || null,
    totalVolume: "0",
    earnedFees: "0",
  };
}

export async function getAllReferrals(
  userAddress: string,
): Promise<ReferralInfo[]> {
  const poolIds = Object.values(POOLS).map((p) => p.id);
  const results = await Promise.all(
    poolIds.map((poolId) => getReferralInfo(userAddress, poolId)),
  );
  return results;
}

export async function claimReferralFees(
  referralId: string,
  poolId: string,
): Promise<{ transaction: string }> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${DEEPBOOK_PACKAGE_ID}::pool::claim_referral_fees`,
    arguments: [tx.object(poolId), tx.object(referralId)],
  });

  const serialized = await tx.build({ client: suiClient });

  return {
    transaction: Buffer.from(serialized).toString("base64"),
  };
}

export async function createBalanceManager(): Promise<{ transaction: string }> {
  const tx = new Transaction();

  const [balanceManager] = tx.moveCall({
    target: `${BALANCE_MANAGER_PACKAGE}::balance_manager::new`,
    arguments: [],
  });

  tx.transferObjects([balanceManager], tx.pure.address("@sender"));

  const serialized = await tx.build({ client: suiClient });

  return {
    transaction: Buffer.from(serialized).toString("base64"),
  };
}

export async function getBalanceManager(userAddress: string): Promise<{
  balanceManagerId: string | null;
  balances: Record<string, string>;
}> {
  const managers = await suiClient.getOwnedObjects({
    owner: userAddress,
    filter: {
      StructType: `${BALANCE_MANAGER_PACKAGE}::balance_manager::BalanceManager`,
    },
    options: { showContent: true },
  });

  if (managers.data.length === 0) {
    return { balanceManagerId: null, balances: {} };
  }

  const manager = managers.data[0];
  return {
    balanceManagerId: manager.data?.objectId || null,
    balances: {},
  };
}

export async function depositToBalanceManager(
  balanceManagerId: string,
  coinType: string,
  coinObjectId: string,
  amount: string,
): Promise<{ transaction: string }> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${BALANCE_MANAGER_PACKAGE}::balance_manager::deposit`,
    typeArguments: [coinType],
    arguments: [
      tx.object(balanceManagerId),
      tx.object(coinObjectId),
      tx.pure.u64(BigInt(amount)),
    ],
  });

  const serialized = await tx.build({ client: suiClient });

  return {
    transaction: Buffer.from(serialized).toString("base64"),
  };
}

export async function withdrawFromBalanceManager(
  balanceManagerId: string,
  coinType: string,
  amount: string,
): Promise<{ transaction: string }> {
  const tx = new Transaction();

  const [coin] = tx.moveCall({
    target: `${BALANCE_MANAGER_PACKAGE}::balance_manager::withdraw`,
    typeArguments: [coinType],
    arguments: [tx.object(balanceManagerId), tx.pure.u64(BigInt(amount))],
  });

  tx.transferObjects([coin], tx.pure.address("@sender"));

  const serialized = await tx.build({ client: suiClient });

  return {
    transaction: Buffer.from(serialized).toString("base64"),
  };
}
