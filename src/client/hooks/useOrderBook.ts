"use client";

import { useState, useEffect, useCallback } from "react";
import type { OrderBook, OrderBookLevel } from "@/shared/types";

interface UseOrderBookOptions {
  poolId: string;
  ticks?: number;
  refreshInterval?: number;
}

interface UseOrderBookResult {
  orderBook: OrderBook | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useOrderBook({
  poolId,
  ticks = 20,
  refreshInterval = 5000,
}: UseOrderBookOptions): UseOrderBookResult {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrderBook = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/orderbook?poolId=${poolId}&ticks=${ticks}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch order book");
      }

      const data = await response.json();

      const parsedOrderBook: OrderBook = {
        poolId: data.poolId,
        baseAsset: data.baseAsset,
        quoteAsset: data.quoteAsset,
        bids: data.bids.map((b: { price: string; quantity: string }) => ({
          price: BigInt(b.price),
          quantity: BigInt(b.quantity),
        })),
        asks: data.asks.map((a: { price: string; quantity: string }) => ({
          price: BigInt(a.price),
          quantity: BigInt(a.quantity),
        })),
        midPrice: BigInt(data.midPrice),
        timestamp: data.timestamp,
      };

      setOrderBook(parsedOrderBook);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [poolId, ticks]);

  useEffect(() => {
    fetchOrderBook();

    const interval = setInterval(fetchOrderBook, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchOrderBook, refreshInterval]);

  return {
    orderBook,
    isLoading,
    error,
    refresh: fetchOrderBook,
  };
}

export function calculateSpread(
  bids: OrderBookLevel[],
  asks: OrderBookLevel[],
): bigint | null {
  if (bids.length === 0 || asks.length === 0) return null;

  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;

  return bestAsk - bestBid;
}

export function calculateMidPrice(
  bids: OrderBookLevel[],
  asks: OrderBookLevel[],
): bigint | null {
  if (bids.length === 0 || asks.length === 0) return null;

  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;

  return (bestBid + bestAsk) / BigInt(2);
}
