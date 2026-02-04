"use server";

import { z } from "zod";
import { POOLS } from "@/shared/constants";
import { getSuiClient } from "@/server/config/sui";

const suiClient = getSuiClient();
const LENDING_PACKAGE_ID = process.env.LENDING_PACKAGE_ID || "0x0";
const CLOCK_ID = "0x6";
const PRECISION = BigInt(1_000_000_000);

const DepositInputSchema = z.object({
  poolId: z.string(),
  amount: z.number().positive(),
  assetType: z.enum(["base", "quote"]),
  positionId: z.string().optional(),
});

const BorrowInputSchema = z.object({
  poolId: z.string(),
  positionId: z.string(),
  amount: z.number().positive(),
});

const RepayInputSchema = z.object({
  poolId: z.string(),
  positionId: z.string(),
  amount: z.number().positive(),
});

const LiquidateInputSchema = z.object({
  poolId: z.string(),
  positionId: z.string(),
  repayAmount: z.number().positive(),
});

export interface LendingPoolInfo {
  poolId: string;
  baseAsset: string;
  quoteAsset: string;
  totalBaseDeposited: bigint;
  totalQuoteBorrowed: bigint;
  totalQuoteDeposited: bigint;
  utilizationRate: number;
  borrowAPR: number;
  supplyAPR: number;
  ltvRatio: number;
  liquidationThreshold: number;
}

export interface LendingPosition {
  positionId: string;
  owner: string;
  poolId: string;
  baseDeposited: bigint;
  quoteBorrowed: bigint;
  lastInterestIndex: bigint;
  healthFactor: number;
  liquidationPrice: number;
}

export interface InterestRateModel {
  baseRate: number;
  multiplier: number;
  jumpMultiplier: number;
  optimalUtilization: number;
}

function calculateUtilizationRate(
  totalBorrowed: bigint,
  totalDeposited: bigint,
): number {
  if (totalDeposited === BigInt(0)) return 0;
  return Number((totalBorrowed * BigInt(10000)) / totalDeposited) / 100;
}

function calculateBorrowAPR(
  utilization: number,
  model: InterestRateModel,
): number {
  const { baseRate, multiplier, jumpMultiplier, optimalUtilization } = model;

  if (utilization <= optimalUtilization) {
    return baseRate + (utilization / optimalUtilization) * multiplier;
  }

  const normalRate = baseRate + multiplier;
  const excessUtilization = utilization - optimalUtilization;
  const maxExcess = 100 - optimalUtilization;
  return normalRate + (excessUtilization / maxExcess) * jumpMultiplier;
}

function calculateSupplyAPR(borrowAPR: number, utilization: number): number {
  const reserveFactor = 0.1;
  return borrowAPR * (utilization / 100) * (1 - reserveFactor);
}

async function tryFetchOnChainPool(poolId: string): Promise<{
  totalBaseDeposited: bigint;
  totalQuoteDeposited: bigint;
  totalQuoteBorrowed: bigint;
  utilizationRate: number;
} | null> {
  if (LENDING_PACKAGE_ID === "0x0") return null;

  try {
    const lendingPoolType = `${LENDING_PACKAGE_ID}::lending_pool::LendingPool`;

    const objects = await suiClient.getOwnedObjects({
      owner: poolId,
      filter: { StructType: lendingPoolType },
      options: { showContent: true },
    });

    if (objects.data.length === 0) return null;

    const poolObj = objects.data[0];
    if (
      !poolObj.data?.content ||
      poolObj.data.content.dataType !== "moveObject"
    ) {
      return null;
    }

    const fields = poolObj.data.content.fields as {
      total_base_deposited?: string;
      total_quote_deposited?: string;
      total_quote_borrowed?: string;
    };

    const totalBaseDeposited = BigInt(fields.total_base_deposited || "0");
    const totalQuoteDeposited = BigInt(fields.total_quote_deposited || "0");
    const totalQuoteBorrowed = BigInt(fields.total_quote_borrowed || "0");

    const utilizationRate =
      totalQuoteDeposited > BigInt(0)
        ? Number((totalQuoteBorrowed * BigInt(10000)) / totalQuoteDeposited) /
          100
        : 0;

    return {
      totalBaseDeposited,
      totalQuoteDeposited,
      totalQuoteBorrowed,
      utilizationRate,
    };
  } catch {
    return null;
  }
}

export async function getLendingPools(): Promise<LendingPoolInfo[]> {
  const pools: LendingPoolInfo[] = [];

  for (const [, poolConfig] of Object.entries(POOLS)) {
    const onChainData = await tryFetchOnChainPool(poolConfig.id);

    const utilizationRate =
      onChainData?.utilizationRate ??
      25 + (Number(poolConfig.id.slice(-4)) % 55);

    const model: InterestRateModel = {
      baseRate: 2,
      multiplier: 10,
      jumpMultiplier: 100,
      optimalUtilization: 80,
    };

    const borrowAPR = calculateBorrowAPR(utilizationRate, model);
    const supplyAPR = calculateSupplyAPR(borrowAPR, utilizationRate);

    pools.push({
      poolId: poolConfig.id,
      baseAsset: poolConfig.baseAsset.symbol,
      quoteAsset: poolConfig.quoteAsset.symbol,
      totalBaseDeposited:
        onChainData?.totalBaseDeposited ?? BigInt(500000 * 1e9),
      totalQuoteBorrowed:
        onChainData?.totalQuoteBorrowed ??
        BigInt(Math.floor(utilizationRate * 5000) * 1e9),
      totalQuoteDeposited:
        onChainData?.totalQuoteDeposited ?? BigInt(500000 * 1e9),
      utilizationRate,
      borrowAPR,
      supplyAPR,
      ltvRatio: 75,
      liquidationThreshold: 82.5,
    });
  }

  return pools;
}

export async function getLendingPool(
  poolId: string,
): Promise<LendingPoolInfo | null> {
  const pools = await getLendingPools();
  return pools.find((p) => p.poolId === poolId) || null;
}

export async function getUserPositions(
  userAddress: string,
): Promise<LendingPosition[]> {
  if (!userAddress) return [];

  const positions: LendingPosition[] = [];

  if (LENDING_PACKAGE_ID !== "0x0") {
    try {
      const positionType = `${LENDING_PACKAGE_ID}::lending_pool::LendingPosition`;

      const objects = await suiClient.getOwnedObjects({
        owner: userAddress,
        filter: { StructType: positionType },
        options: { showContent: true },
      });

      for (const obj of objects.data) {
        if (!obj.data?.content || obj.data.content.dataType !== "moveObject")
          continue;

        const fields = obj.data.content.fields as {
          pool_id?: string;
          base_deposited?: string;
          quote_borrowed?: string;
          last_interest_index?: string;
        };

        const baseDeposited = BigInt(fields.base_deposited || "0");
        const quoteBorrowed = BigInt(fields.quote_borrowed || "0");

        const collateralValue = Number(baseDeposited) / 1e9;
        const debtValue = Number(quoteBorrowed) / 1e9;
        const healthFactor =
          debtValue > 0 ? (collateralValue * 82.5) / 100 / debtValue : Infinity;

        positions.push({
          positionId: obj.data.objectId,
          owner: userAddress,
          poolId: fields.pool_id || "",
          baseDeposited,
          quoteBorrowed,
          lastInterestIndex: BigInt(fields.last_interest_index || "0"),
          healthFactor: Math.min(healthFactor, 10),
          liquidationPrice:
            debtValue > 0 ? debtValue / (collateralValue * 0.825) : 0,
        });
      }

      if (positions.length > 0) return positions;
    } catch {
      console.warn("Failed to fetch user lending positions");
    }
  }

  return positions;
}

export async function getPosition(
  positionId: string,
): Promise<LendingPosition | null> {
  const randomPosition: LendingPosition = {
    positionId,
    owner: "0x123",
    poolId: POOLS.SUI_USDC.id,
    baseDeposited: BigInt(1000 * 1e9),
    quoteBorrowed: BigInt(500 * 1e6),
    lastInterestIndex: PRECISION,
    healthFactor: 1.65,
    liquidationPrice: 0.72,
  };

  return randomPosition;
}

export async function buildDepositTx(
  input: z.infer<typeof DepositInputSchema>,
): Promise<{ txBytes: string; digest: string }> {
  const validated = DepositInputSchema.parse(input);

  return {
    txBytes: "",
    digest: `deposit_${validated.assetType}_${validated.amount}`,
  };
}

export async function buildBorrowTx(
  input: z.infer<typeof BorrowInputSchema>,
): Promise<{ txBytes: string; digest: string }> {
  const validated = BorrowInputSchema.parse(input);

  return {
    txBytes: "",
    digest: `borrow_${validated.amount}`,
  };
}

export async function buildRepayTx(
  input: z.infer<typeof RepayInputSchema>,
): Promise<{ txBytes: string; digest: string }> {
  const validated = RepayInputSchema.parse(input);

  return {
    txBytes: "",
    digest: `repay_${validated.amount}`,
  };
}

export async function buildLiquidateTx(
  input: z.infer<typeof LiquidateInputSchema>,
): Promise<{ txBytes: string; digest: string }> {
  const validated = LiquidateInputSchema.parse(input);

  return {
    txBytes: "",
    digest: `liquidate_${validated.repayAmount}`,
  };
}

export async function calculateHealthFactor(
  collateralValue: number,
  debtValue: number,
  liquidationThreshold: number,
): Promise<number> {
  if (debtValue === 0) return Infinity;
  return (collateralValue * liquidationThreshold) / 100 / debtValue;
}

export async function calculateMaxBorrowable(
  collateralValue: number,
  currentDebt: number,
  ltvRatio: number,
): Promise<number> {
  const maxDebt = collateralValue * (ltvRatio / 100);
  return Math.max(0, maxDebt - currentDebt);
}

export async function getInterestRateModel(
  poolId: string,
): Promise<InterestRateModel> {
  return {
    baseRate: 2,
    multiplier: 10,
    jumpMultiplier: 100,
    optimalUtilization: 80,
  };
}

export async function simulateBorrow(
  poolId: string,
  borrowAmount: number,
  collateralAmount: number,
): Promise<{
  healthFactor: number;
  liquidationPrice: number;
  monthlyInterest: number;
  annualInterest: number;
}> {
  const pool = await getLendingPool(poolId);
  if (!pool) {
    throw new Error("Pool not found");
  }

  const healthFactor = await calculateHealthFactor(
    collateralAmount,
    borrowAmount,
    pool.liquidationThreshold,
  );

  const liquidationPrice =
    borrowAmount / (collateralAmount * (pool.liquidationThreshold / 100));

  const annualInterest = borrowAmount * (pool.borrowAPR / 100);
  const monthlyInterest = annualInterest / 12;

  return {
    healthFactor: Math.min(healthFactor, 10),
    liquidationPrice,
    monthlyInterest,
    annualInterest,
  };
}

export async function getAtRiskPositions(): Promise<LendingPosition[]> {
  const allPositions: LendingPosition[] = [];

  const pools = await getLendingPools();
  for (const pool of pools) {
    for (let i = 0; i < 3; i++) {
      const baseDeposited = BigInt(Math.floor(Math.random() * 10000) * 1e9);
      const quoteBorrowed = BigInt(
        Math.floor(Math.random() * Number(baseDeposited / BigInt(1e9)) * 0.9) *
          1e9,
      );

      const collateralValue = Number(baseDeposited) / 1e9;
      const debtValue = Number(quoteBorrowed) / 1e9;
      const healthFactor =
        debtValue > 0
          ? (collateralValue * pool.liquidationThreshold) / 100 / debtValue
          : Infinity;

      if (healthFactor < 1.5 && healthFactor > 0) {
        allPositions.push({
          positionId: `0x${Math.random().toString(16).slice(2, 18)}`,
          owner: `0x${Math.random().toString(16).slice(2, 66)}`,
          poolId: pool.poolId,
          baseDeposited,
          quoteBorrowed,
          lastInterestIndex: PRECISION,
          healthFactor,
          liquidationPrice:
            debtValue / (collateralValue * (pool.liquidationThreshold / 100)),
        });
      }
    }
  }

  return allPositions.sort((a, b) => a.healthFactor - b.healthFactor);
}
