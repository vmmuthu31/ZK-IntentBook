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

  async getOrderBook(poolKey: string, ticks: number = 20): Promise<OrderBook> {
    try {
      const level2Data = await this.deepBookClient.getLevel2TicksFromMid(
        poolKey,
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
        poolId: poolKey,
        bids,
        asks,
        midPrice,
        spread,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Failed to fetch order book:", error);
      throw new Error(`Failed to fetch order book for pool ${poolKey}`);
    }
  }

  async getOrderBookByRange(
    poolKey: string,
    priceLow: number,
    priceHigh: number,
    isBid: boolean,
  ): Promise<{ prices: number[]; quantities: number[] }> {
    try {
      return await this.deepBookClient.getLevel2Range(
        poolKey,
        priceLow,
        priceHigh,
        isBid,
      );
    } catch (error) {
      console.error("Failed to fetch order book range:", error);
      throw new Error(`Failed to fetch order book range for pool ${poolKey}`);
    }
  }

  async getMidPrice(poolKey: string): Promise<number> {
    try {
      return await this.deepBookClient.midPrice(poolKey);
    } catch (error) {
      console.error("Failed to fetch mid price:", error);
      throw new Error(`Failed to fetch mid price for pool ${poolKey}`);
    }
  }

  async getQuoteQuantityOut(
    poolKey: string,
    baseQuantity: number,
  ): Promise<{
    baseQuantity: number;
    baseOut: number;
    quoteOut: number;
    deepRequired: number;
  }> {
    try {
      return await this.deepBookClient.getQuoteQuantityOut(
        poolKey,
        baseQuantity,
      );
    } catch (error) {
      console.error("Failed to get quote quantity out:", error);
      throw new Error(`Failed to get quote quantity for pool ${poolKey}`);
    }
  }

  async getBaseQuantityOut(
    poolKey: string,
    quoteQuantity: number,
  ): Promise<{
    quoteQuantity: number;
    baseOut: number;
    quoteOut: number;
    deepRequired: number;
  }> {
    try {
      return await this.deepBookClient.getBaseQuantityOut(
        poolKey,
        quoteQuantity,
      );
    } catch (error) {
      console.error("Failed to get base quantity out:", error);
      throw new Error(`Failed to get base quantity for pool ${poolKey}`);
    }
  }

  async getQuantityOut(
    poolKey: string,
    baseQuantity: number,
    quoteQuantity: number,
  ): Promise<{
    baseQuantity: number;
    quoteQuantity: number;
    baseOut: number;
    quoteOut: number;
    deepRequired: number;
  }> {
    try {
      return await this.deepBookClient.getQuantityOut(
        poolKey,
        baseQuantity,
        quoteQuantity,
      );
    } catch (error) {
      console.error("Failed to get quantity out:", error);
      throw new Error(`Failed to get quantity out for pool ${poolKey}`);
    }
  }

  async isPoolWhitelisted(poolKey: string): Promise<boolean> {
    try {
      return await this.deepBookClient.whitelisted(poolKey);
    } catch (error) {
      console.error("Failed to check pool whitelist:", error);
      throw new Error(`Failed to check whitelist for pool ${poolKey}`);
    }
  }

  async getVaultBalances(
    poolKey: string,
  ): Promise<{ base: number; quote: number; deep: number }> {
    try {
      return await this.deepBookClient.vaultBalances(poolKey);
    } catch (error) {
      console.error("Failed to fetch vault balances:", error);
      throw new Error(`Failed to fetch vault balances for pool ${poolKey}`);
    }
  }

  async getPoolTradeParams(
    poolKey: string,
  ): Promise<{ takerFee: number; makerFee: number; stakeRequired: number }> {
    try {
      return await this.deepBookClient.poolTradeParams(poolKey);
    } catch (error) {
      console.error("Failed to fetch trade params:", error);
      throw new Error(`Failed to fetch trade params for pool ${poolKey}`);
    }
  }

  async getPoolBookParams(
    poolKey: string,
  ): Promise<{ tickSize: number; lotSize: number; minSize: number }> {
    try {
      return await this.deepBookClient.poolBookParams(poolKey);
    } catch (error) {
      console.error("Failed to fetch book params:", error);
      throw new Error(`Failed to fetch book params for pool ${poolKey}`);
    }
  }

  async getPoolIdByAssets(
    baseType: string,
    quoteType: string,
  ): Promise<string> {
    try {
      return await this.deepBookClient.getPoolIdByAssets(baseType, quoteType);
    } catch (error) {
      console.error("Failed to get pool ID by assets:", error);
      throw new Error("Failed to get pool ID by assets");
    }
  }

  async getOrder(poolKey: string, orderId: string) {
    try {
      return await this.deepBookClient.getOrder(poolKey, orderId);
    } catch (error) {
      console.error("Failed to get order:", error);
      throw new Error(`Failed to get order ${orderId}`);
    }
  }

  async getOrders(poolKey: string, orderIds: string[]) {
    try {
      return await this.deepBookClient.getOrders(poolKey, orderIds);
    } catch (error) {
      console.error("Failed to get orders:", error);
      throw new Error("Failed to get orders");
    }
  }

  async getAccountOpenOrders(
    poolKey: string,
    managerKey: string,
  ): Promise<bigint[]> {
    try {
      const orders = await this.deepBookClient.accountOpenOrders(
        poolKey,
        managerKey,
      );
      return orders.map((order) => BigInt(order));
    } catch (error) {
      console.error("Failed to get account open orders:", error);
      throw new Error("Failed to get account open orders");
    }
  }

  async getAccount(poolKey: string, managerKey: string) {
    try {
      return await this.deepBookClient.account(poolKey, managerKey);
    } catch (error) {
      console.error("Failed to get account:", error);
      throw new Error("Failed to get account info");
    }
  }

  async getLockedBalance(
    poolKey: string,
    managerKey: string,
  ): Promise<{ base: number; quote: number; deep: number }> {
    try {
      return await this.deepBookClient.lockedBalance(poolKey, managerKey);
    } catch (error) {
      console.error("Failed to get locked balance:", error);
      throw new Error("Failed to get locked balance");
    }
  }

  async checkManagerBalance(
    managerKey: string,
    coinKey: string,
  ): Promise<{ coinType: string; balance: number }> {
    try {
      return await this.deepBookClient.checkManagerBalance(managerKey, coinKey);
    } catch (error) {
      console.error("Failed to check manager balance:", error);
      throw new Error("Failed to check manager balance");
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

  decodeOrderId(encodedOrderId: bigint): {
    isBid: boolean;
    price: number;
    orderId: number;
  } {
    return this.deepBookClient.decodeOrderId(encodedOrderId);
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
