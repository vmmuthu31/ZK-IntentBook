export interface Order {
  orderId: string;
  balanceManagerId: string;
  clientOrderId: number;
  poolId: string;
  price: bigint;
  quantity: bigint;
  filledQuantity: bigint;
  isBid: boolean;
  status: OrderStatus;
  createdAt: number;
  expireTimestamp: number;
}

export type OrderStatus =
  | "open"
  | "partial"
  | "filled"
  | "cancelled"
  | "expired";

export interface OrderPlacement {
  poolId: string;
  balanceManagerId: string;
  clientOrderId: number;
  orderType: OrderType;
  selfMatchingOption: SelfMatchingOption;
  price: bigint;
  quantity: bigint;
  isBid: boolean;
  payWithDeep: boolean;
  expireTimestamp: number;
}

export type OrderType =
  | "no_restriction"
  | "immediate_or_cancel"
  | "fill_or_kill"
  | "post_only";
export type SelfMatchingOption =
  | "self_matching_allowed"
  | "cancel_taker"
  | "cancel_maker";

export interface SwapParams {
  poolId: string;
  baseIn?: bigint;
  quoteIn?: bigint;
  deepIn: bigint;
  minOut: bigint;
}

export interface TradeResult {
  txDigest: string;
  baseAmount: bigint;
  quoteAmount: bigint;
  deepFee: bigint;
  price: bigint;
}
