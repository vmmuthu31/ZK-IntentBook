"use server";

import { z } from "zod";
import { POOLS } from "@/shared/constants";

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

export async function getLendingPools(): Promise<LendingPoolInfo[]> {
  const pools: LendingPoolInfo[] = [];

  for (const [poolName, poolConfig] of Object.entries(POOLS)) {
    const utilizationRate = Math.random() * 80;
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
      totalBaseDeposited: BigInt(Math.floor(Math.random() * 1000000) * 1e9),
      totalQuoteBorrowed: BigInt(Math.floor(Math.random() * 500000) * 1e9),
      totalQuoteDeposited: BigInt(Math.floor(Math.random() * 800000) * 1e9),
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

  const pools = await getLendingPools();

  for (const pool of pools) {
    if (Math.random() > 0.5) {
      const baseDeposited = BigInt(Math.floor(Math.random() * 10000) * 1e9);
      const quoteBorrowed = BigInt(
        Math.floor(Math.random() * Number(baseDeposited / BigInt(1e9)) * 0.6) *
          1e9,
      );

      const collateralValue = Number(baseDeposited) / 1e9;
      const debtValue = Number(quoteBorrowed) / 1e9;
      const healthFactor =
        debtValue > 0
          ? (collateralValue * pool.liquidationThreshold) / 100 / debtValue
          : Infinity;

      positions.push({
        positionId: `0x${Math.random().toString(16).slice(2, 18)}`,
        owner: userAddress,
        poolId: pool.poolId,
        baseDeposited,
        quoteBorrowed,
        lastInterestIndex: PRECISION,
        healthFactor: Math.min(healthFactor, 10),
        liquidationPrice:
          debtValue > 0 ? debtValue / (collateralValue * 0.825) : 0,
      });
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
