export interface ZKProof {
  publicInputs: string[];
  proofBytes: Uint8Array;
  verificationKey: string;
}

export interface ProofRequest {
  intentId: string;
  commitmentHash: string;
  executionPrice: string;
  executedSize: string;
  poolId: string;
  orderBookSnapshot: OrderBookSnapshot;
  minPrice?: string;
  maxPrice?: string;
}

export interface OrderBookSnapshot {
  poolId: string;
  bids: Array<{ price: string; quantity: string }>;
  asks: Array<{ price: string; quantity: string }>;
  timestamp: number;
}

export interface ProofResponse {
  success: boolean;
  proof?: ZKProof;
  error?: string;
  provingTimeMs?: number;
}

export interface ProofVerificationResult {
  valid: boolean;
  error?: string;
}

export interface PublicInputs {
  commitmentHash: string;
  poolId: string;
  executionPrice: string;
  executedSize: string;
  minPrice: string;
  maxPrice: string;
  deadline: string;
}

export interface CircuitInputs {
  intentHash: string;
  owner: string;
  poolId: string;
  direction: number;
  maxSize: string;
  minPrice: string;
  maxPrice: string;
  deadline: string;
  executionPrice: string;
  executedSize: string;
  orderBookRoot: string;
  liquidityProof: string[];
}
