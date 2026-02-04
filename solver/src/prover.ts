import type { Execution, ProofResult } from "./types.js";
import { logger } from "./logger.js";

export class ProverClient {
  private readonly proverUrl: string;

  constructor(proverUrl: string) {
    this.proverUrl = proverUrl;
  }

  async generateProof(
    intent: {
      inputToken: string;
      outputToken: string;
      inputAmount: string;
      minOutputAmount: string;
      maxSlippageBps: number;
      deadlineSeconds: number;
      userAddress: string;
    },
    execution: Execution,
    solverAddress: string,
  ): Promise<ProofResult> {
    logger.info("Requesting proof generation from prover service");

    const request = {
      intent: {
        input_token: intent.inputToken,
        output_token: intent.outputToken,
        input_amount: BigInt(intent.inputAmount),
        min_output_amount: BigInt(intent.minOutputAmount),
        max_slippage_bps: intent.maxSlippageBps,
        deadline: Math.floor(Date.now() / 1000) + intent.deadlineSeconds,
        user_address: intent.userAddress,
      },
      execution: {
        intent_commitment: hexToBytes32(execution.intentCommitment),
        pool_id: execution.poolId,
        executed_input_amount: BigInt(execution.executedInputAmount),
        executed_output_amount: BigInt(execution.executedOutputAmount),
        execution_price: BigInt(execution.executionPrice),
        timestamp: BigInt(execution.timestamp),
        solver_address: solverAddress,
      },
    };

    try {
      const response = await fetch(`${this.proverUrl}/prove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request, bigIntReplacer),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Prover service error: ${error}`);
      }

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        proof: number[];
        public_inputs: {
          intent_commitment: string;
          pool_id_hash: string;
          executed_output_amount: string;
          solver_address_hash: string;
          timestamp: string;
        };
      };

      if (!result.success) {
        throw new Error(result.error || "Proof generation failed");
      }

      return {
        proof: new Uint8Array(result.proof),
        publicInputs: {
          intentCommitment: hexToBytes32(
            result.public_inputs.intent_commitment,
          ),
          poolIdHash: hexToBytes32(result.public_inputs.pool_id_hash),
          executedOutputAmount: BigInt(
            result.public_inputs.executed_output_amount,
          ),
          solverAddressHash: hexToBytes32(
            result.public_inputs.solver_address_hash,
          ),
          timestamp: BigInt(result.public_inputs.timestamp),
        },
      };
    } catch (error) {
      logger.error("Proof generation request failed", { error });
      throw error;
    }
  }

  async verifyProof(
    proof: Uint8Array,
    publicInputs: ProofResult["publicInputs"],
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.proverUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: Array.from(proof),
          public_inputs: {
            intent_commitment: Array.from(publicInputs.intentCommitment),
            pool_id_hash: Array.from(publicInputs.poolIdHash),
            executed_output_amount:
              publicInputs.executedOutputAmount.toString(),
            solver_address_hash: Array.from(publicInputs.solverAddressHash),
            timestamp: publicInputs.timestamp.toString(),
          },
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = (await response.json()) as { valid: boolean };
      return result.valid === true;
    } catch (error) {
      logger.error("Proof verification request failed", { error });
      return false;
    }
  }
}

function hexToBytes32(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32 && i * 2 < cleanHex.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}
