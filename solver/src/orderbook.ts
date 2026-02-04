import { SuiClient } from "@mysten/sui/client";
import { DeepBookClient } from "@mysten/deepbook-v3";
import type { DecryptedIntent, Execution, OrderBook } from "./types.js";
import { logger } from "./logger.js";

const POOLS: Record<string, string> = {
  "SUI-USDC":
    "0x0c0fdd4008740d81a8a7d4281322aee71a1b62c449eb5b142656753d89ebc060",
  "DEEP-USDC":
    "0x1170b057b1a044dc311f04c7e9f4bf99137e0dd9e4495226f5a77cbf40a2a49b",
  "WAL-USDC":
    "0x0a5e7e3c1a14664de54d7d39c8b2fa3f8f8c9c0c0d0e0f0a0b0c0d0e0f0a0b0c",
};

export class OrderBookService {
  private readonly suiClient: SuiClient;
  private readonly deepBookClient: DeepBookClient;

  constructor(rpcUrl: string) {
    this.suiClient = new SuiClient({ url: rpcUrl });
    this.deepBookClient = new DeepBookClient({
      address: "0x0",
      network: "testnet",
      client: this.suiClient,
    });
  }

  async getOrderBook(
    baseToken: string,
    quoteToken: string,
  ): Promise<OrderBook> {
    const poolKey = `${baseToken}-${quoteToken}`;
    const poolId = POOLS[poolKey] || POOLS[`${quoteToken}-${baseToken}`];

    if (!poolId) {
      throw new Error(`Unknown trading pair: ${poolKey}`);
    }

    try {
      const [bidLevel2, askLevel2] = await Promise.all([
        this.deepBookClient.getLevel2Range(poolId, 0, 1e18, true),
        this.deepBookClient.getLevel2Range(poolId, 0, 1e18, false),
      ]);

      const bids = bidLevel2.prices.map((price, i) => ({
        price: price.toString(),
        quantity: bidLevel2.quantities[i].toString(),
      }));

      const asks = askLevel2.prices.map((price, i) => ({
        price: price.toString(),
        quantity: askLevel2.quantities[i].toString(),
      }));

      return { bids, asks, timestamp: Date.now() };
    } catch (error) {
      logger.error("Failed to fetch order book", { poolId, error });
      throw error;
    }
  }

  computeOptimalExecution(
    intent: DecryptedIntent,
    orderBook: OrderBook,
  ): Execution | null {
    const { inputToken, outputToken, inputAmount, minOutputAmount } =
      intent.intent;
    const inputAmountBigInt = BigInt(inputAmount);
    const minOutputBigInt = BigInt(minOutputAmount);

    const isBuy = outputToken === "USDC" ? false : true;
    const levels = isBuy ? orderBook.asks : orderBook.bids;

    let remainingInput = inputAmountBigInt;
    let totalOutput = 0n;

    for (const level of levels) {
      if (remainingInput <= 0n) break;

      const levelPrice = BigInt(level.price);
      const levelQuantity = BigInt(level.quantity);

      const fillQuantity =
        remainingInput < levelQuantity ? remainingInput : levelQuantity;
      const fillOutput = isBuy
        ? fillQuantity
        : (fillQuantity * levelPrice) / BigInt(1e9);

      remainingInput -= fillQuantity;
      totalOutput += fillOutput;
    }

    if (totalOutput < minOutputBigInt) {
      logger.warn("Cannot satisfy minimum output requirement", {
        totalOutput: totalOutput.toString(),
        minOutput: minOutputAmount,
      });
      return null;
    }

    const executedInput = inputAmountBigInt - remainingInput;
    const avgPrice = (totalOutput * BigInt(1e9)) / executedInput;

    return {
      intentCommitment: intent.commitment,
      poolId:
        POOLS[`${inputToken}-${outputToken}`] ||
        POOLS[`${outputToken}-${inputToken}`],
      executedInputAmount: executedInput.toString(),
      executedOutputAmount: totalOutput.toString(),
      executionPrice: avgPrice.toString(),
      timestamp: Date.now(),
    };
  }

  getPoolId(baseToken: string, quoteToken: string): string | undefined {
    return (
      POOLS[`${baseToken}-${quoteToken}`] || POOLS[`${quoteToken}-${baseToken}`]
    );
  }
}
