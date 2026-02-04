import { z } from "zod";

export const SwapParamsSchema = z
  .object({
    poolId: z.string().min(1),
    baseIn: z.string().optional(),
    quoteIn: z.string().optional(),
    deepIn: z.string().default("0"),
    minOut: z.string().refine((val) => {
      try {
        return BigInt(val) >= BigInt(0);
      } catch {
        return false;
      }
    }),
  })
  .refine((data) => {
    const hasBase = data.baseIn && BigInt(data.baseIn) > BigInt(0);
    const hasQuote = data.quoteIn && BigInt(data.quoteIn) > BigInt(0);
    return (hasBase && !hasQuote) || (!hasBase && hasQuote);
  }, "Exactly one of baseIn or quoteIn must be provided");

export const LimitOrderSchema = z.object({
  poolId: z.string().min(1),
  balanceManagerId: z.string().min(1),
  clientOrderId: z.number().int().nonnegative(),
  orderType: z
    .enum([
      "no_restriction",
      "immediate_or_cancel",
      "fill_or_kill",
      "post_only",
    ])
    .default("no_restriction"),
  selfMatchingOption: z
    .enum(["self_matching_allowed", "cancel_taker", "cancel_maker"])
    .default("self_matching_allowed"),
  price: z
    .string()
    .refine((val) => BigInt(val) > BigInt(0), "Price must be positive"),
  quantity: z
    .string()
    .refine((val) => BigInt(val) > BigInt(0), "Quantity must be positive"),
  isBid: z.boolean(),
  payWithDeep: z.boolean().default(true),
  expireTimestamp: z.number().int().positive(),
});

export type SwapParamsInput = z.infer<typeof SwapParamsSchema>;
export type LimitOrderInput = z.infer<typeof LimitOrderSchema>;
