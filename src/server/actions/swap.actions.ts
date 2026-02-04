"use server";

import { deepBookService } from "../services/deepbook.service";
import { Transaction } from "@mysten/sui/transactions";
import { z } from "zod";
import { POOLS } from "@/shared/constants/pools";

const SwapParamsSchema = z.object({
  poolId: z.string().min(1),
  isBid: z.boolean(),
  baseAmount: z.string().refine((val) => {
    try {
      return BigInt(val) > BigInt(0);
    } catch {
      return false;
    }
  }),
  quoteAmount: z.string().refine((val) => {
    try {
      return BigInt(val) > BigInt(0);
    } catch {
      return false;
    }
  }),
  slippageBps: z.number().int().min(0).max(10000).default(100),
});

export async function buildSwapTransaction(input: unknown) {
  try {
    const params = SwapParamsSchema.parse(input);

    const pool = Object.values(POOLS).find((p) => p.id === params.poolId);
    if (!pool) {
      return {
        success: false,
        error: "Pool not found",
      };
    }

    const tx = new Transaction();

    const baseAmount = BigInt(params.baseAmount);
    const quoteAmount = BigInt(params.quoteAmount);

    if (params.isBid) {
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_DEEPBOOK_PACKAGE_ID}::pool::place_market_order`,
        arguments: [
          tx.object(params.poolId),
          tx.pure.u64(quoteAmount),
          tx.pure.bool(true),
          tx.pure.u64(baseAmount),
          tx.pure.u64(params.slippageBps),
        ],
        typeArguments: [pool.baseAsset.type, pool.quoteAsset.type],
      });
    } else {
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_DEEPBOOK_PACKAGE_ID}::pool::place_market_order`,
        arguments: [
          tx.object(params.poolId),
          tx.pure.u64(baseAmount),
          tx.pure.bool(false),
          tx.pure.u64(quoteAmount),
          tx.pure.u64(params.slippageBps),
        ],
        typeArguments: [pool.baseAsset.type, pool.quoteAsset.type],
      });
    }

    const txBytes = await tx.build({
      client: deepBookService["suiClient"],
    });

    return {
      success: true,
      data: {
        transaction: Array.from(txBytes),
      },
    };
  } catch (error) {
    console.error("buildSwapTransaction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to build swap transaction",
    };
  }
}

export async function estimateSwapOutput(input: unknown) {
  try {
    const params = SwapParamsSchema.parse(input);

    const orderBook = await deepBookService.getOrderBook(params.poolId, 50);

    let remainingAmount = params.isBid
      ? BigInt(params.quoteAmount)
      : BigInt(params.baseAmount);
    let totalOutput = BigInt(0);

    const levels = params.isBid ? orderBook.asks : orderBook.bids;

    for (const level of levels) {
      if (remainingAmount <= BigInt(0)) break;

      const levelPrice = BigInt(Math.floor(level.price * 1e9));
      const levelQuantity = BigInt(Math.floor(level.quantity * 1e9));

      if (params.isBid) {
        const canBuy = remainingAmount / levelPrice;
        const actualBuy = canBuy < levelQuantity ? canBuy : levelQuantity;
        totalOutput += actualBuy;
        remainingAmount -= actualBuy * levelPrice;
      } else {
        const actualSell =
          remainingAmount < levelQuantity ? remainingAmount : levelQuantity;
        totalOutput += actualSell * levelPrice;
        remainingAmount -= actualSell;
      }
    }

    return {
      success: true,
      data: {
        estimatedOutput: totalOutput.toString(),
        priceImpact: 0,
      },
    };
  } catch (error) {
    console.error("estimateSwapOutput error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to estimate swap output",
    };
  }
}
