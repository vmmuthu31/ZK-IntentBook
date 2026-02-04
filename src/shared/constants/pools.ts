import { PoolConfig, ASSETS } from "./assets";

export const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
  | "testnet"
  | "mainnet";

export const DEEPBOOK_PACKAGE_IDS = {
  testnet: "0xcbf4748a965d469ea3a36cf0ccc5743b96c2d0ae6dee0762ed3eca65fac07f7e",
  mainnet: "0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963c8e8b5eb548dee4ca",
} as const;

export const DEEPBOOK_PACKAGE_ID = DEEPBOOK_PACKAGE_IDS[NETWORK];

export const POOLS: Record<string, PoolConfig> = {
  SUI_USDC: {
    id:
      NETWORK === "mainnet"
        ? "0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407"
        : "0x0c0fdd4008740d81a8a7d4281322aee71a1b62c449eb5b142656753d89ebc060",
    name: "SUI/USDC",
    baseAsset: ASSETS.SUI,
    quoteAsset: ASSETS.USDC,
    tickSize: BigInt(100000),
    lotSize: BigInt(1000000000),
    minSize: BigInt(1000000000),
  },
  DEEP_USDC: {
    id:
      NETWORK === "mainnet"
        ? "0xf948981b806057580f91622417534f491c63ba8a78322f5e024a9a1cfa855c80"
        : "0x1170b057b1a044dc311f04c7e9f4bf99137e0dd9e4495226f5a77cbf40a2a49b",
    name: "DEEP/USDC",
    baseAsset: ASSETS.DEEP,
    quoteAsset: ASSETS.USDC,
    tickSize: BigInt(10000),
    lotSize: BigInt(100000000),
    minSize: BigInt(100000000),
  },
  SUI_DEEP: {
    id:
      NETWORK === "mainnet"
        ? "0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22"
        : "0xa0b9ebefb38c963fd115f52d71fa64501b79d1adcb5270563f92ce0442376545",
    name: "SUI/DEEP",
    baseAsset: ASSETS.SUI,
    quoteAsset: ASSETS.DEEP,
    tickSize: BigInt(1000000),
    lotSize: BigInt(1000000000),
    minSize: BigInt(1000000000),
  },
  WAL_USDC: {
    id:
      NETWORK === "mainnet"
        ? "0x0a5e7e3c1a14664de54d7d39c8b2fa3f8f8c9c0c0d0e0f0a0b0c0d0e0f0a0b0c"
        : "0x0a5e7e3c1a14664de54d7d39c8b2fa3f8f8c9c0c0d0e0f0a0b0c0d0e0f0a0b0c",
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
