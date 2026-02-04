import { FLOAT_SCALING } from "../constants";

export function formatBalance(amount: bigint, decimals: number): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;

  if (fraction === BigInt(0)) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, "0");
  const trimmed = fractionStr.replace(/0+$/, "");

  return `${whole}.${trimmed}`;
}

export function parseBalance(amount: string, decimals: number): bigint {
  const parts = amount.split(".");
  const whole = BigInt(parts[0] || "0");

  if (parts.length === 1) {
    return whole * BigInt(10) ** BigInt(decimals);
  }

  const fractionStr = (parts[1] || "").padEnd(decimals, "0").slice(0, decimals);
  const fraction = BigInt(fractionStr);

  return whole * BigInt(10) ** BigInt(decimals) + fraction;
}

export function formatPrice(
  price: bigint,
  baseDecimals: number,
  quoteDecimals: number,
): string {
  const adjustedPrice =
    (price * BigInt(10) ** BigInt(quoteDecimals)) / FLOAT_SCALING;
  return formatBalance(adjustedPrice, quoteDecimals);
}

export function parsePrice(
  price: string,
  baseDecimals: number,
  quoteDecimals: number,
): bigint {
  const parsed = parseBalance(price, quoteDecimals);
  return (parsed * FLOAT_SCALING) / BigInt(10) ** BigInt(quoteDecimals);
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
