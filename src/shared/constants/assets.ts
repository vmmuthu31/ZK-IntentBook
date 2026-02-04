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

export const ASSETS: Record<string, AssetConfig> = {
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
