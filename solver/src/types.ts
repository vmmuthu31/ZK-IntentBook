import { z } from "zod";

export const IntentSchema = z.object({
  inputToken: z.string(),
  outputToken: z.string(),
  inputAmount: z.string(),
  minOutputAmount: z.string(),
  maxSlippageBps: z.number().int().min(0).max(10000),
  deadlineSeconds: z.number().int().positive(),
  mevProtection: z.boolean(),
});

export type Intent = z.infer<typeof IntentSchema>;

export interface EncryptedIntent {
  ciphertext: string;
  ephemeralPublicKey: string;
  nonce: string;
  commitment: string;
}

export interface DecryptedIntent {
  intent: Intent;
  commitment: string;
  userAddress: string;
  timestamp: number;
}

export interface Execution {
  intentCommitment: string;
  poolId: string;
  executedInputAmount: string;
  executedOutputAmount: string;
  executionPrice: string;
  timestamp: number;
}

export interface ProofResult {
  proof: Uint8Array;
  publicInputs: {
    intentCommitment: Uint8Array;
    poolIdHash: Uint8Array;
    executedOutputAmount: bigint;
    solverAddressHash: Uint8Array;
    timestamp: bigint;
  };
}

export interface OrderBookLevel {
  price: string;
  quantity: string;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface SolverConfig {
  privateKey: string;
  suiRpcUrl: string;
  websocketPort: number;
  httpPort: number;
  proverServiceUrl: string;
  minProfitBps: number;
}
