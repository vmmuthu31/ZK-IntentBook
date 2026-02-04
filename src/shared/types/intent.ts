export type IntentType = "swap" | "limit" | "twap";
export type Direction = "buy" | "sell";

import type { ZKProof } from "./proof";

export interface Intent {
  id: string;
  owner: string;
  intentType: IntentType;
  baseAsset: string;
  quoteAsset: string;
  poolId: string;
  direction: Direction;
  maxSize: bigint;
  minPrice?: bigint;
  maxPrice?: bigint;
  deadline: number;
  mevProtection: boolean;
  createdAt: number;
}

export interface EncryptedIntent {
  commitmentHash: string;
  encryptedPayload: string;
  ephemeralPublicKey: string;
  nonce: string;
  timestamp: number;
}

export interface IntentExecution {
  intentId: string;
  commitmentHash: string;
  executionPrice: bigint;
  executedSize: bigint;
  proof: ZKProof;
  solverAddress: string;
  txDigest: string;
}

export interface IntentSubmission {
  intent: Intent;
  encrypted: EncryptedIntent;
  signature: string;
}

export interface IntentStatus {
  id: string;
  status:
    | "pending"
    | "matched"
    | "executing"
    | "settled"
    | "expired"
    | "cancelled";
  commitmentHash: string;
  execution?: IntentExecution;
  error?: string;
}
