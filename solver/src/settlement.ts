import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import type { Execution, ProofResult } from "./types.js";
import { logger } from "./logger.js";

const PACKAGE_ID = process.env.PACKAGE_ID || "0x0";

export class SettlementService {
  private readonly suiClient: SuiClient;
  private readonly keypair: Ed25519Keypair;

  constructor(rpcUrl: string, privateKeyHex: string) {
    this.suiClient = new SuiClient({ url: rpcUrl });
    this.keypair = Ed25519Keypair.fromSecretKey(hexToBytes(privateKeyHex));
  }

  async submitSettlement(
    registryId: string,
    verifierConfigId: string,
    vaultId: string,
    execution: Execution,
    proof: ProofResult,
  ): Promise<string> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::settlement::execute_verified_settlement`,
      arguments: [
        tx.object(registryId),
        tx.object(verifierConfigId),
        tx.object(vaultId),
        tx.pure.vector(
          "u8",
          Array.from(hexToBytes(execution.intentCommitment)),
        ),
        tx.pure.vector("u8", Array.from(proof.proof)),
        tx.pure.vector("u8", serializePublicInputs(proof.publicInputs)),
        tx.pure.u64(BigInt(execution.executedOutputAmount)),
        tx.object("0x6"),
      ],
    });

    try {
      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer: this.keypair,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      if (result.effects?.status?.status !== "success") {
        throw new Error(`Settlement failed: ${result.effects?.status?.error}`);
      }

      logger.info("Settlement submitted successfully", {
        digest: result.digest,
        intentCommitment: execution.intentCommitment,
      });

      return result.digest;
    } catch (error) {
      logger.error("Settlement submission failed", { error, execution });
      throw error;
    }
  }

  async getIntentStatus(
    registryId: string,
    commitment: string,
  ): Promise<number> {
    try {
      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${PACKAGE_ID}::intent_registry::get_intent`,
            arguments: [
              tx.object(registryId),
              tx.pure.vector("u8", Array.from(hexToBytes(commitment))),
            ],
          });
          return tx;
        })(),
        sender: this.keypair.toSuiAddress(),
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const returnValue = result.results[0].returnValues[0];
        const statusBytes = returnValue[0] as number[];
        return statusBytes[0] ?? 0;
      }

      return -1;
    } catch (error) {
      logger.error("Failed to get intent status", { error, commitment });
      return -1;
    }
  }

  getSolverAddress(): string {
    return this.keypair.toSuiAddress();
  }
}

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function serializePublicInputs(inputs: ProofResult["publicInputs"]): number[] {
  const result: number[] = [];

  result.push(...Array.from(inputs.intentCommitment));
  result.push(...Array.from(inputs.poolIdHash));

  const outputBytes = new Uint8Array(8);
  new DataView(outputBytes.buffer).setBigUint64(
    0,
    inputs.executedOutputAmount,
    true,
  );
  result.push(...Array.from(outputBytes));

  result.push(...Array.from(inputs.solverAddressHash));

  const timestampBytes = new Uint8Array(8);
  new DataView(timestampBytes.buffer).setBigUint64(0, inputs.timestamp, true);
  result.push(...Array.from(timestampBytes));

  return result;
}
