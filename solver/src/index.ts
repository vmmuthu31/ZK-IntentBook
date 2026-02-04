import "dotenv/config";
import { Solver } from "./solver.js";
import { logger } from "./logger.js";
import type { SolverConfig } from "./types.js";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

async function main(): Promise<void> {
  const config: SolverConfig = {
    privateKey: getRequiredEnv("SOLVER_PRIVATE_KEY"),
    suiRpcUrl: process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io:443",
    websocketPort: parseInt(process.env.WS_PORT || "3002", 10),
    httpPort: parseInt(process.env.HTTP_PORT || "3003", 10),
    proverServiceUrl: process.env.PROVER_URL || "http://localhost:3001",
    minProfitBps: parseInt(process.env.MIN_PROFIT_BPS || "10", 10),
  };

  const solver = new Solver(config);

  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down...");
    await solver.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down...");
    await solver.stop();
    process.exit(0);
  });

  await solver.start();
}

main().catch((error) => {
  logger.error("Fatal error", { error });
  process.exit(1);
});

export * from "./types.js";
export { Solver } from "./solver.js";
export { IntentDecryptor } from "./crypto.js";
export { OrderBookService } from "./orderbook.js";
export { ProverClient } from "./prover.js";
export { SettlementService } from "./settlement.js";
