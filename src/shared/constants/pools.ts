import { PoolConfig, ASSETS } from "./assets";

export const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
  | "testnet"
  | "mainnet";

export const DEEPBOOK_PACKAGE_IDS = {
  testnet: "0xcbf4748a965d469ea3a36cf0ccc5743b96c2d0ae6dee0762ed3eca65fac07f7e",
  mainnet: "0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963c8e8b5eb548dee4ca",
} as const;

export const DEEPBOOK_INDEXER_URL =
  process.env.NEXT_PUBLIC_DEEPBOOK_INDEXER_URL ||
  (NETWORK === "testnet"
    ? "https://deepbook-indexer.testnet.mystenlabs.com"
    : "https://deepbook-indexer.mainnet.mystenlabs.com");

export const DEEPBOOK_PACKAGE_ID = DEEPBOOK_PACKAGE_IDS[NETWORK];

export const TESTNET_POOLS: Record<string, PoolConfig> = {
  DEEP_SUI: {
    id: "0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f",
    name: "DEEP/SUI",
    baseAsset: ASSETS.DEEP,
    quoteAsset: ASSETS.SUI,
    tickSize: BigInt(10000000),
    lotSize: BigInt(1000000),
    minSize: BigInt(10000000),
  },
  SUI_DBUSDC: {
    id: "0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5",
    name: "SUI/DBUSDC",
    baseAsset: ASSETS.SUI,
    quoteAsset: ASSETS.DBUSDC,
    tickSize: BigInt(10),
    lotSize: BigInt(100000000),
    minSize: BigInt(1000000000),
  },
  DEEP_DBUSDC: {
    id: "0xe86b991f8632217505fd859445f9803967ac84a9d4a1219065bf191fcb74b622",
    name: "DEEP/DBUSDC",
    baseAsset: ASSETS.DEEP,
    quoteAsset: ASSETS.DBUSDC,
    tickSize: BigInt(1000000),
    lotSize: BigInt(1000000),
    minSize: BigInt(10000000),
  },
  DBUSDT_DBUSDC: {
    id: "0x83970bb02e3636efdff8c141ab06af5e3c9a22e2f74d7f02a9c3430d0d10c1ca",
    name: "DBUSDT/DBUSDC",
    baseAsset: ASSETS.DBUSDT,
    quoteAsset: ASSETS.DBUSDC,
    tickSize: BigInt(1000000),
    lotSize: BigInt(100000),
    minSize: BigInt(1000000),
  },
  WAL_SUI: {
    id: "0x8c1c1b186c4fddab1ebd53e0895a36c1d1b3b9a77cd34e607bef49a38af0150a",
    name: "WAL/SUI",
    baseAsset: ASSETS.WAL,
    quoteAsset: ASSETS.SUI,
    tickSize: BigInt(1000),
    lotSize: BigInt(100000000),
    minSize: BigInt(1000000000),
  },
  WAL_DBUSDC: {
    id: "0xeb524b6aea0ec4b494878582e0b78924208339d360b62aec4a8ecd4031520dbb",
    name: "WAL/DBUSDC",
    baseAsset: ASSETS.WAL,
    quoteAsset: ASSETS.DBUSDC,
    tickSize: BigInt(1),
    lotSize: BigInt(100000000),
    minSize: BigInt(1000000000),
  },
  DBTC_DBUSDC: {
    id: "0x0dce0aa771074eb83d1f4a29d48be8248d4d2190976a5241f66b43ec18fa34de",
    name: "DBTC/DBUSDC",
    baseAsset: ASSETS.DBTC,
    quoteAsset: ASSETS.DBUSDC,
    tickSize: BigInt(10000000),
    lotSize: BigInt(1000),
    minSize: BigInt(1000),
  },
};

export const MAINNET_POOLS: Record<string, PoolConfig> = {
  SUI_USDC: {
    id: "0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407",
    name: "SUI/USDC",
    baseAsset: ASSETS.SUI,
    quoteAsset: ASSETS.USDC,
    tickSize: BigInt(100000),
    lotSize: BigInt(1000000000),
    minSize: BigInt(1000000000),
  },
  DEEP_USDC: {
    id: "0xf948981b806057580f91622417534f491c63ba8a78322f5e024a9a1cfa855c80",
    name: "DEEP/USDC",
    baseAsset: ASSETS.DEEP,
    quoteAsset: ASSETS.USDC,
    tickSize: BigInt(10000),
    lotSize: BigInt(100000000),
    minSize: BigInt(100000000),
  },
  SUI_DEEP: {
    id: "0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22",
    name: "SUI/DEEP",
    baseAsset: ASSETS.SUI,
    quoteAsset: ASSETS.DEEP,
    tickSize: BigInt(1000000),
    lotSize: BigInt(1000000000),
    minSize: BigInt(1000000000),
  },
};

export const POOLS: Record<string, PoolConfig> =
  NETWORK === "testnet" ? TESTNET_POOLS : MAINNET_POOLS;

export const POOL_LIST = Object.values(POOLS);

export function getPoolById(id: string): PoolConfig | undefined {
  return Object.values(POOLS).find((pool) => pool.id === id);
}

export function getPoolByName(name: string): PoolConfig | undefined {
  const key = name.replace("/", "_").toUpperCase();
  return POOLS[key];
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
