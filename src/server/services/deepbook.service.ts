import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { DeepBookClient } from "@mysten/deepbook-v3";
import { getSuiClient, getNetwork } from "../config/sui";
import type { OrderBook, OrderBookLevel } from "@/shared/types/orderbook";

export class DeepBookService {
  private suiClient: SuiJsonRpcClient;
  private deepBookClient: DeepBookClient;

  constructor() {
    this.suiClient = getSuiClient();
    const network = getNetwork();
    this.deepBookClient = new DeepBookClient({
      address: "0x0",
      client: this.suiClient,
      network: network === "mainnet" ? "mainnet" : "testnet",
    });
  }

  async getOrderBook(poolId: string, ticks: number = 20): Promise<OrderBook> {
    try {
      const level2Data = await this.deepBookClient.getLevel2TicksFromMid(
        poolId,
        ticks,
      );

      const bids: OrderBookLevel[] = level2Data.bid_prices.map((price, i) => ({
        price,
        quantity: level2Data.bid_quantities[i],
        total: price * level2Data.bid_quantities[i],
      }));

      const asks: OrderBookLevel[] = level2Data.ask_prices.map((price, i) => ({
        price,
        quantity: level2Data.ask_quantities[i],
        total: price * level2Data.ask_quantities[i],
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
      return await this.deepBookClient.whitelisted(poolId);
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
