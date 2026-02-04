"use server";

import { DeepBookService } from "../services/deepbook.service";

export interface TradeAnalysis {
  expectedPrice: number;
  estimatedSlippage: number;
  estimatedMevRisk: number;
  priceImpact: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  depth: {
    bids: number;
    asks: number;
  };
}

export interface PrivateTradeAnalysis extends TradeAnalysis {
  protectedPrice: number;
  savingsEstimate: number;
  mevProtected: boolean;
}

export async function analyzePublicTrade(
  poolKey: string,
  tradeSize: number,
  isBuy: boolean,
): Promise<{ success: boolean; data?: TradeAnalysis; error?: string }> {
  try {
    const service = new DeepBookService();
    const orderBook = await service.getOrderBook(poolKey, 50);

    const bestBid = orderBook.bids[0]?.price || 0;
    const bestAsk = orderBook.asks[0]?.price || 0;
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;

    const levels = isBuy ? orderBook.asks : orderBook.bids;
    let remainingSize = tradeSize;
    let totalCost = 0;
    let levelsConsumed = 0;

    for (const level of levels) {
      if (remainingSize <= 0) break;

      const fillSize = Math.min(remainingSize, level.quantity);
      totalCost += fillSize * level.price;
      remainingSize -= fillSize;
      levelsConsumed++;
    }

    const avgExecutionPrice = tradeSize > 0 ? totalCost / tradeSize : midPrice;
    const priceImpact =
      Math.abs((avgExecutionPrice - midPrice) / midPrice) * 100;

    const estimatedSlippage = priceImpact + (spread / midPrice) * 100 * 0.5;

    const bidDepth = orderBook.bids.reduce(
      (sum, l) => sum + l.quantity * l.price,
      0,
    );
    const askDepth = orderBook.asks.reduce(
      (sum, l) => sum + l.quantity * l.price,
      0,
    );
    const totalDepth = bidDepth + askDepth;
    const depthRatio = totalDepth > 0 ? tradeSize / totalDepth : 0;
    const estimatedMevRisk = Math.min(depthRatio * 500, 5) * (tradeSize / 1000);

    return {
      success: true,
      data: {
        expectedPrice: midPrice,
        estimatedSlippage,
        estimatedMevRisk,
        priceImpact,
        bestBid,
        bestAsk,
        spread,
        depth: {
          bids: bidDepth,
          asks: askDepth,
        },
      },
    };
  } catch (error) {
    console.error("Failed to analyze public trade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Analysis failed",
    };
  }
}

export async function analyzePrivateTrade(
  poolKey: string,
  tradeSize: number,
  isBuy: boolean,
): Promise<{ success: boolean; data?: PrivateTradeAnalysis; error?: string }> {
  try {
    const publicResult = await analyzePublicTrade(poolKey, tradeSize, isBuy);

    if (!publicResult.success || !publicResult.data) {
      return { success: false, error: publicResult.error };
    }

    const pub = publicResult.data;

    const protectedSlippage = pub.estimatedSlippage * 0.3;
    const protectedMevRisk = 0;

    const slippageSavings =
      ((pub.estimatedSlippage - protectedSlippage) * tradeSize) / 100;
    const mevSavings = pub.estimatedMevRisk;
    const savingsEstimate = slippageSavings + mevSavings;

    const protectedPriceAdjustment = isBuy
      ? pub.expectedPrice * (1 + protectedSlippage / 100)
      : pub.expectedPrice * (1 - protectedSlippage / 100);

    return {
      success: true,
      data: {
        ...pub,
        estimatedSlippage: protectedSlippage,
        estimatedMevRisk: protectedMevRisk,
        protectedPrice: protectedPriceAdjustment,
        savingsEstimate,
        mevProtected: true,
      },
    };
  } catch (error) {
    console.error("Failed to analyze private trade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Analysis failed",
    };
  }
}

export async function getPoolMidPrice(
  poolKey: string,
): Promise<{ success: boolean; price?: number; error?: string }> {
  try {
    const service = new DeepBookService();
    const price = await service.getMidPrice(poolKey);
    return { success: true, price };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get price",
    };
  }
}

export async function getSwapQuote(
  poolKey: string,
  inputAmount: number,
  isBuy: boolean,
): Promise<{
  success: boolean;
  data?: {
    inputAmount: number;
    outputAmount: number;
    price: number;
    priceImpact: number;
  };
  error?: string;
}> {
  try {
    const service = new DeepBookService();

    const quote = isBuy
      ? await service.getBaseQuantityOut(poolKey, inputAmount)
      : await service.getQuoteQuantityOut(poolKey, inputAmount);

    const midPrice = await service.getMidPrice(poolKey);

    const effectivePrice = isBuy
      ? inputAmount / quote.baseOut
      : quote.quoteOut / inputAmount;

    const priceImpact = Math.abs((effectivePrice - midPrice) / midPrice) * 100;

    return {
      success: true,
      data: {
        inputAmount,
        outputAmount: isBuy ? quote.baseOut : quote.quoteOut,
        price: effectivePrice,
        priceImpact,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get quote",
    };
  }
}
