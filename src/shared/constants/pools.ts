import { PoolConfig, ASSETS } from "./assets";

export const DEEPBOOK_PACKAGE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000002";

export const POOLS: Record<string, PoolConfig> = {
  SUI_USDC: {
    id: "0x0",
    name: "SUI/USDC",
    baseAsset: ASSETS.SUI,
    quoteAsset: ASSETS.USDC,
    tickSize: BigInt(100000),
    lotSize: BigInt(1000000000),
    minSize: BigInt(1000000000),
  },
  DEEP_USDC: {
    id: "0x0",
    name: "DEEP/USDC",
    baseAsset: ASSETS.DEEP,
    quoteAsset: ASSETS.USDC,
    tickSize: BigInt(100000),
    lotSize: BigInt(1000000000),
    minSize: BigInt(1000000000),
  },
  WAL_USDC: {
    id: "0x0",
    name: "WAL/USDC",
    baseAsset: ASSETS.WAL,
    quoteAsset: ASSETS.USDC,
    tickSize: BigInt(100000),
    lotSize: BigInt(1000000000),
    minSize: BigInt(1000000000),
  },
};

export const POOL_LIST = Object.values(POOLS);

export function getPoolById(id: string): PoolConfig | undefined {
  return Object.values(POOLS).find((pool) => pool.id === id);
}

export function getPoolByName(name: string): PoolConfig | undefined {
  return POOLS[name.replace("/", "_").toUpperCase()];
}

export const ORDER_TYPES = {
  NO_RESTRICTION: 0,
  IMMEDIATE_OR_CANCEL: 1,
  FILL_OR_KILL: 2,
  POST_ONLY: 3,
} as const;

export const SELF_MATCHING_OPTIONS = {
  SELF_MATCHING_ALLOWED: 0,
  CANCEL_TAKER: 1,
  CANCEL_MAKER: 2,
} as const;

export const FLOAT_SCALING = BigInt(1_000_000_000);
