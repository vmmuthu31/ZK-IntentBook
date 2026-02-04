import { z } from "zod";

export const IntentTypeSchema = z.enum(["swap", "limit", "twap"]);
export const DirectionSchema = z.enum(["buy", "sell"]);

export const CreateIntentSchema = z.object({
  intentType: IntentTypeSchema.default("swap"),
  baseAsset: z.string().min(1),
  quoteAsset: z.string().min(1),
  poolId: z.string().min(1),
  direction: DirectionSchema,
  maxSize: z.string().refine((val) => {
    try {
      return BigInt(val) > BigInt(0);
    } catch {
      return false;
    }
  }, "Must be a positive integer"),
  minPrice: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        return BigInt(val) >= BigInt(0);
      } catch {
        return false;
      }
    }, "Must be a non-negative integer"),
  maxPrice: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        return BigInt(val) > BigInt(0);
      } catch {
        return false;
      }
    }, "Must be a positive integer"),
  deadlineSeconds: z.number().int().positive().max(3600).default(30),
  mevProtection: z.boolean().default(true),
});

export const EncryptedIntentSchema = z.object({
  commitmentHash: z.string().length(66),
  encryptedPayload: z.string().min(1),
  ephemeralPublicKey: z.string().min(1),
  nonce: z.string().min(1),
  timestamp: z.number().int().positive(),
});

export const IntentSubmissionSchema = z.object({
  encrypted: EncryptedIntentSchema,
  signature: z.string().min(1),
});

export type CreateIntentInput = z.infer<typeof CreateIntentSchema>;
export type EncryptedIntentInput = z.infer<typeof EncryptedIntentSchema>;
export type IntentSubmissionInput = z.infer<typeof IntentSubmissionSchema>;
