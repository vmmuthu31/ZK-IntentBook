"use server";

import { z } from "zod";
import { Transaction } from "@mysten/sui/transactions";
import { getSuiClient } from "../config/sui";
import {
  createEncryptedIntent,
  generateCommitmentHash,
  hexToPublicKey,
} from "../security";
import type { Intent, EncryptedIntent, IntentSubmission } from "@/shared/types";
import { CreateIntentSchema } from "@/shared/schemas";

const INTENT_REGISTRY_ID =
  process.env.NEXT_PUBLIC_INTENT_REGISTRY_ID ||
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const ZK_INTENTBOOK_PACKAGE_ID =
  process.env.NEXT_PUBLIC_ZK_INTENTBOOK_PACKAGE_ID ||
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const SOLVER_PUBLIC_KEY =
  process.env.SOLVER_PUBLIC_KEY ||
  "0000000000000000000000000000000000000000000000000000000000000000";

const SubmitIntentInputSchema = z.object({
  intent: CreateIntentSchema,
  userAddress: z.string().min(1),
});

const CancelIntentInputSchema = z.object({
  commitmentHash: z.string().length(66),
  userAddress: z.string().min(1),
});

const GetIntentStatusInputSchema = z.object({
  commitmentHash: z.string().length(66),
});

export interface SubmitIntentResult {
  success: boolean;
  data?: {
    intent: Intent;
    encrypted: EncryptedIntent;
    transactionBytes: number[];
  };
  error?: string;
}

export interface IntentStatusResult {
  success: boolean;
  data?: {
    status: "pending" | "matched" | "settled" | "cancelled" | "expired";
    executionPrice?: string;
    executedSize?: string;
    solver?: string;
  };
  error?: string;
}

export async function submitIntent(
  input: unknown,
): Promise<SubmitIntentResult> {
  try {
    const params = SubmitIntentInputSchema.parse(input);

    const intentId = generateIntentId();
    const now = Date.now();
    const deadlineMs = now + params.intent.deadlineSeconds * 1000;

    const intent: Intent = {
      id: intentId,
      owner: params.userAddress,
      intentType: params.intent.intentType,
      baseAsset: params.intent.baseAsset,
      quoteAsset: params.intent.quoteAsset,
      poolId: params.intent.poolId,
      direction: params.intent.direction,
      maxSize: BigInt(params.intent.maxSize),
      minPrice: params.intent.minPrice
        ? BigInt(params.intent.minPrice)
        : undefined,
      maxPrice: params.intent.maxPrice
        ? BigInt(params.intent.maxPrice)
        : undefined,
      deadline: deadlineMs,
      mevProtection: params.intent.mevProtection,
      createdAt: now,
    };

    const solverPubKey = hexToPublicKey(SOLVER_PUBLIC_KEY);
    const encrypted = createEncryptedIntent(intent, solverPubKey);

    const tx = new Transaction();

    const commitmentHashBytes = hexToBytes(encrypted.commitmentHash);
    const poolIdBytes = hexToBytes(params.intent.poolId);

    tx.moveCall({
      target: `${ZK_INTENTBOOK_PACKAGE_ID}::intent_registry::submit_commitment`,
      arguments: [
        tx.object(INTENT_REGISTRY_ID),
        tx.pure.vector("u8", Array.from(commitmentHashBytes)),
        tx.pure.u64(deadlineMs),
        tx.pure.id(params.intent.poolId),
        tx.object("0x6"),
      ],
    });

    const suiClient = getSuiClient();
    const txBytes = await tx.build({ client: suiClient });

    await sendToSolverNetwork(encrypted, intent);

    return {
      success: true,
      data: {
        intent,
        encrypted,
        transactionBytes: Array.from(txBytes),
      },
    };
  } catch (error) {
    console.error("submitIntent error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit intent",
    };
  }
}

export async function cancelIntent(
  input: unknown,
): Promise<{ success: boolean; transactionBytes?: number[]; error?: string }> {
  try {
    const params = CancelIntentInputSchema.parse(input);

    const tx = new Transaction();

    const commitmentHashBytes = hexToBytes(params.commitmentHash);

    tx.moveCall({
      target: `${ZK_INTENTBOOK_PACKAGE_ID}::intent_registry::cancel_intent`,
      arguments: [
        tx.object(INTENT_REGISTRY_ID),
        tx.pure.vector("u8", Array.from(commitmentHashBytes)),
      ],
    });

    const suiClient = getSuiClient();
    const txBytes = await tx.build({ client: suiClient });

    return {
      success: true,
      transactionBytes: Array.from(txBytes),
    };
  } catch (error) {
    console.error("cancelIntent error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel intent",
    };
  }
}

export async function getIntentStatus(
  input: unknown,
): Promise<IntentStatusResult> {
  try {
    const params = GetIntentStatusInputSchema.parse(input);

    const suiClient = getSuiClient();

    const tx = new Transaction();
    const commitmentHashBytes = hexToBytes(params.commitmentHash);

    tx.moveCall({
      target: `${ZK_INTENTBOOK_PACKAGE_ID}::intent_registry::get_intent`,
      arguments: [
        tx.object(INTENT_REGISTRY_ID),
        tx.pure.vector("u8", Array.from(commitmentHashBytes)),
      ],
    });

    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    });

    if (result.results && result.results.length > 0) {
      const returnValues = result.results[0].returnValues;
      if (returnValues && returnValues.length > 0) {
        const statusMap: Record<
          number,
          "pending" | "matched" | "settled" | "cancelled" | "expired"
        > = {
          0: "pending",
          1: "matched",
          2: "settled",
          3: "cancelled",
          4: "expired",
        };

        return {
          success: true,
          data: {
            status: statusMap[0] || "pending",
          },
        };
      }
    }

    return {
      success: false,
      error: "Intent not found",
    };
  } catch (error) {
    console.error("getIntentStatus error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get intent status",
    };
  }
}

export async function getPendingIntents(
  userAddress: string,
): Promise<{ success: boolean; data?: Intent[]; error?: string }> {
  try {
    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error("getPendingIntents error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get pending intents",
    };
  }
}

function generateIntentId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `intent_${timestamp}_${randomPart}`;
}

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function sendToSolverNetwork(
  encrypted: EncryptedIntent,
  intent: Intent,
): Promise<void> {
  const solverUrl = process.env.NEXT_PUBLIC_SOLVER_URL;
  if (!solverUrl) {
    console.warn("Solver URL not configured, skipping solver notification");
    return;
  }

  try {
    const response = await fetch(`${solverUrl}/api/intents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        encrypted,
        poolId: intent.poolId,
        deadline: intent.deadline,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send intent to solver:", await response.text());
    }
  } catch (error) {
    console.error("Error sending intent to solver:", error);
  }
}
