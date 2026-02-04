"use server";

import { z } from "zod";
import {
  getLendingPools,
  getLendingPool,
  getUserPositions,
  getPosition,
  buildDepositTx,
  buildBorrowTx,
  buildRepayTx,
  buildLiquidateTx,
  simulateBorrow,
  calculateMaxBorrowable,
  getAtRiskPositions,
  getInterestRateModel,
  type LendingPoolInfo,
  type LendingPosition,
  type InterestRateModel,
} from "@/server/services/lending.service";

const DepositSchema = z.object({
  poolId: z.string().min(1),
  amount: z.number().positive(),
  assetType: z.enum(["base", "quote"]),
  positionId: z.string().optional(),
});

const BorrowSchema = z.object({
  poolId: z.string().min(1),
  positionId: z.string().min(1),
  amount: z.number().positive(),
});

const RepaySchema = z.object({
  poolId: z.string().min(1),
  positionId: z.string().min(1),
  amount: z.number().positive(),
});

const LiquidateSchema = z.object({
  poolId: z.string().min(1),
  positionId: z.string().min(1),
  repayAmount: z.number().positive(),
});

const SimulateBorrowSchema = z.object({
  poolId: z.string().min(1),
  borrowAmount: z.number().positive(),
  collateralAmount: z.number().positive(),
});

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function fetchLendingPoolsAction(): Promise<
  ActionResult<LendingPoolInfo[]>
> {
  try {
    const pools = await getLendingPools();
    return { success: true, data: pools };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function fetchLendingPoolAction(
  poolId: string,
): Promise<ActionResult<LendingPoolInfo>> {
  try {
    if (!poolId) {
      return { success: false, error: "Pool ID is required" };
    }

    const pool = await getLendingPool(poolId);
    if (!pool) {
      return { success: false, error: "Pool not found" };
    }

    return { success: true, data: pool };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function fetchUserPositionsAction(
  userAddress: string,
): Promise<ActionResult<LendingPosition[]>> {
  try {
    if (!userAddress) {
      return { success: false, error: "User address is required" };
    }

    const positions = await getUserPositions(userAddress);
    return { success: true, data: positions };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function fetchPositionAction(
  positionId: string,
): Promise<ActionResult<LendingPosition>> {
  try {
    if (!positionId) {
      return { success: false, error: "Position ID is required" };
    }

    const position = await getPosition(positionId);
    if (!position) {
      return { success: false, error: "Position not found" };
    }

    return { success: true, data: position };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function depositAction(
  input: z.infer<typeof DepositSchema>,
): Promise<ActionResult<{ txBytes: string; digest: string }>> {
  try {
    const validated = DepositSchema.parse(input);
    const result = await buildDepositTx(validated);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function borrowAction(
  input: z.infer<typeof BorrowSchema>,
): Promise<ActionResult<{ txBytes: string; digest: string }>> {
  try {
    const validated = BorrowSchema.parse(input);
    const result = await buildBorrowTx(validated);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function repayAction(
  input: z.infer<typeof RepaySchema>,
): Promise<ActionResult<{ txBytes: string; digest: string }>> {
  try {
    const validated = RepaySchema.parse(input);
    const result = await buildRepayTx(validated);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function liquidateAction(
  input: z.infer<typeof LiquidateSchema>,
): Promise<ActionResult<{ txBytes: string; digest: string }>> {
  try {
    const validated = LiquidateSchema.parse(input);
    const result = await buildLiquidateTx(validated);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function simulateBorrowAction(
  input: z.infer<typeof SimulateBorrowSchema>,
): Promise<
  ActionResult<{
    healthFactor: number;
    liquidationPrice: number;
    monthlyInterest: number;
    annualInterest: number;
  }>
> {
  try {
    const validated = SimulateBorrowSchema.parse(input);
    const result = await simulateBorrow(
      validated.poolId,
      validated.borrowAmount,
      validated.collateralAmount,
    );
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function calculateMaxBorrowableAction(
  collateralValue: number,
  currentDebt: number,
  ltvRatio: number,
): Promise<ActionResult<number>> {
  try {
    if (collateralValue < 0 || currentDebt < 0 || ltvRatio < 0) {
      return { success: false, error: "Values must be non-negative" };
    }

    const maxBorrowable = await calculateMaxBorrowable(
      collateralValue,
      currentDebt,
      ltvRatio,
    );
    return { success: true, data: maxBorrowable };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function fetchAtRiskPositionsAction(): Promise<
  ActionResult<LendingPosition[]>
> {
  try {
    const positions = await getAtRiskPositions();
    return { success: true, data: positions };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function fetchInterestRateModelAction(
  poolId: string,
): Promise<ActionResult<InterestRateModel>> {
  try {
    if (!poolId) {
      return { success: false, error: "Pool ID is required" };
    }

    const model = await getInterestRateModel(poolId);
    return { success: true, data: model };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
