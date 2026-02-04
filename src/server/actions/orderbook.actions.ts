"use server";

import { deepBookService } from "../services/deepbook.service";
import { z } from "zod";

const GetOrderBookSchema = z.object({
  poolId: z.string().min(1),
  ticks: z.number().int().positive().max(100).optional().default(20),
});

const GetBalancesSchema = z.object({
  address: z.string().min(1),
  coinTypes: z.array(z.string()).min(1),
});

export async function getOrderBookAction(input: unknown) {
  try {
    const { poolId, ticks } = GetOrderBookSchema.parse(input);
    const orderBook = await deepBookService.getOrderBook(poolId, ticks);
    return { success: true, data: orderBook };
  } catch (error) {
    console.error("getOrderBookAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch order book",
    };
  }
}

export async function getPoolInfoAction(poolId: string) {
  try {
    const poolInfo = await deepBookService.getPoolInfo(poolId);
    return { success: true, data: poolInfo };
  } catch (error) {
    console.error("getPoolInfoAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch pool info",
    };
  }
}

export async function getUserBalancesAction(input: unknown) {
  try {
    const { address, coinTypes } = GetBalancesSchema.parse(input);
    const balances = await deepBookService.getUserBalances(address, coinTypes);
    return { success: true, data: balances };
  } catch (error) {
    console.error("getUserBalancesAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch balances",
    };
  }
}
