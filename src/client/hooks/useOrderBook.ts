"use client";

import { useState, useEffect, useCallback } from "react";
import { getOrderBookAction } from "@/server/actions/orderbook.actions";
import type { OrderBook } from "@/shared/types/orderbook";

interface UseOrderBookOptions {
  poolId: string;
  ticks?: number;
  refreshInterval?: number;
}

interface UseOrderBookReturn {
  orderBook: OrderBook | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOrderBook({
  poolId,
  ticks = 20,
  refreshInterval = 5000,
}: UseOrderBookOptions): UseOrderBookReturn {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderBook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getOrderBookAction({ poolId, ticks });

      if (result.success && result.data) {
        setOrderBook(result.data);
      } else {
        setError(result.error || "Failed to fetch order book");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [poolId, ticks]);

  useEffect(() => {
    fetchOrderBook();

    const interval = setInterval(fetchOrderBook, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchOrderBook, refreshInterval]);

  return {
    orderBook,
    loading,
    error,
    refresh: fetchOrderBook,
  };
}
