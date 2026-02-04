import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { DeepBookClient } from "@mysten/deepbook-v3";
import { getSuiClient } from "../config/sui";
import type { OrderBook, OrderBookLevel } from "@/shared/types/orderbook";

export class DeepBookService {
  private suiClient: SuiJsonRpcClient;
  private deepBookClient: DeepBookClient;

  constructor() {
    this.suiClient = getSuiClient();
    this.deepBookClient = new DeepBookClient({
      client: this.suiClient,
      env:
        process.env.NEXT_PUBLIC_SUI_NETWORK === "mainnet"
          ? "mainnet"
          : "testnet",
    });
  }

  async getOrderBook(poolId: string, ticks: number = 20): Promise<OrderBook> {
    try {
      const orderBookData = await this.deepBookClient.getLevel2Range({
        poolId,
        ticksFromMid: ticks,
      });

      const bids: OrderBookLevel[] = orderBookData.bids.map((bid) => ({
        price: bid.price,
        quantity: bid.quantity,
        total: bid.price * bid.quantity,
      }));

      const asks: OrderBookLevel[] = orderBookData.asks.map((ask) => ({
        price: ask.price,
        quantity: ask.quantity,
        total: ask.price * ask.quantity,
      }));

      const midPrice = this.calculateMidPrice(bids, asks);
      const spread = this.calculateSpread(bids, asks);

      return {
        poolId,
        bids,
        asks,
        midPrice,
        spread,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Failed to fetch order book:", error);
      throw new Error(`Failed to fetch order book for pool ${poolId}`);
    }
  }

  async getPoolInfo(poolId: string) {
    try {
      return await this.deepBookClient.getPool(poolId);
    } catch (error) {
      console.error("Failed to fetch pool info:", error);
      throw new Error(`Failed to fetch pool info for ${poolId}`);
    }
  }

  async getUserBalances(address: string, coinTypes: string[]) {
    try {
      const balances = await Promise.all(
        coinTypes.map(async (coinType) => {
          const balance = await this.suiClient.getBalance({
            owner: address,
            coinType,
          });
          return {
            coinType,
            balance: BigInt(balance.totalBalance),
          };
        }),
      );
      return balances;
    } catch (error) {
      console.error("Failed to fetch user balances:", error);
      throw new Error("Failed to fetch user balances");
    }
  }

  private calculateMidPrice(
    bids: OrderBookLevel[],
    asks: OrderBookLevel[],
  ): number {
    if (bids.length === 0 || asks.length === 0) return 0;
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    return (bestBid + bestAsk) / 2;
  }

  private calculateSpread(
    bids: OrderBookLevel[],
    asks: OrderBookLevel[],
  ): number {
    if (bids.length === 0 || asks.length === 0) return 0;
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    return bestAsk - bestBid;
  }
}

export const deepBookService = new DeepBookService();
