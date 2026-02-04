export interface PoolConfig {
  id: string;
  name: string;
  baseAsset: AssetConfig;
  quoteAsset: AssetConfig;
  tickSize: bigint;
  lotSize: bigint;
  minSize: bigint;
}

export interface AssetConfig {
  type: string;
  symbol: string;
  decimals: number;
  iconUrl?: string;
}

const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
  | "testnet"
  | "mainnet";

export const ASSETS: Record<string, AssetConfig> =
  NETWORK === "testnet"
    ? {
        SUI: {
          type: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
          symbol: "SUI",
          decimals: 9,
          iconUrl: "/assets/sui.svg",
        },
        DBUSDC: {
          type: "0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC",
          symbol: "DBUSDC",
          decimals: 6,
          iconUrl: "/assets/usdc.svg",
        },
        DEEP: {
          type: "0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP",
          symbol: "DEEP",
          decimals: 6,
          iconUrl: "/assets/deep.svg",
        },
        WAL: {
          type: "0x9ef7676a9f81937a52ae4b2af8d511a28a0b080477c0c2db40b0ab8882240d76::wal::WAL",
          symbol: "WAL",
          decimals: 9,
          iconUrl: "/assets/wal.svg",
        },
        DBUSDT: {
          type: "0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDT::DBUSDT",
          symbol: "DBUSDT",
          decimals: 6,
          iconUrl: "/assets/usdt.svg",
        },
        DBTC: {
          type: "0x6502dae813dbe5e42643c119a6450a518481f03063febc7e20238e43b6ea9e86::dbtc::DBTC",
          symbol: "DBTC",
          decimals: 8,
          iconUrl: "/assets/btc.svg",
        },
      }
    : {
        SUI: {
          type: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
          symbol: "SUI",
          decimals: 9,
          iconUrl: "/assets/sui.svg",
        },
        USDC: {
          type: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
          symbol: "USDC",
          decimals: 6,
          iconUrl: "/assets/usdc.svg",
        },
        DEEP: {
          type: "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
          symbol: "DEEP",
          decimals: 6,
          iconUrl: "/assets/deep.svg",
        },
        WAL: {
          type: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
          symbol: "WAL",
          decimals: 9,
          iconUrl: "/assets/wal.svg",
        },
      };

export const ASSET_LIST = Object.values(ASSETS);

export function getAssetBySymbol(symbol: string): AssetConfig | undefined {
  return ASSETS[symbol.toUpperCase()];
}

export function getAssetByType(type: string): AssetConfig | undefined {
  return Object.values(ASSETS).find((asset) => asset.type === type);
}
