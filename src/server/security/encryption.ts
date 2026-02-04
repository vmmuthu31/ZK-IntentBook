import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { randomBytes } from "@noble/ciphers/webcrypto";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import type { Intent, EncryptedIntent } from "@/shared/types";
import { x25519 } from "@noble/curves/ed25519.js";

const NONCE_LENGTH = 24;

export interface EncryptionKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface EncryptionResult {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  commitmentHash: string;
}

export function generateKeyPair(): EncryptionKeyPair {
  const privateKey = randomBytes(32);
  const publicKey = x25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

export function deriveSharedSecret(
  privateKey: Uint8Array,
  publicKey: Uint8Array,
): Uint8Array {
  const sharedPoint = x25519.getSharedSecret(privateKey, publicKey);
  return sha256(sharedPoint);
}

export function encryptIntent(
  intent: Intent,
  solverPublicKey: Uint8Array,
): EncryptionResult {
  const ephemeral = generateKeyPair();

  const sharedSecret = deriveSharedSecret(
    ephemeral.privateKey,
    solverPublicKey,
  );

  const intentBytes = utf8ToBytes(JSON.stringify(serializeIntent(intent)));

  const nonce = randomBytes(NONCE_LENGTH);

  const cipher = xchacha20poly1305(sharedSecret, nonce);
  const ciphertext = cipher.encrypt(intentBytes);

  const commitmentHash = generateCommitmentHash(intent);

  return {
    ciphertext,
    nonce,
    ephemeralPublicKey: ephemeral.publicKey,
    commitmentHash,
  };
}

export function decryptIntent(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  ephemeralPublicKey: Uint8Array,
  privateKey: Uint8Array,
): Intent {
  const sharedSecret = deriveSharedSecret(privateKey, ephemeralPublicKey);

  const cipher = xchacha20poly1305(sharedSecret, nonce);
  const plaintext = cipher.decrypt(ciphertext);

  const decoded = new TextDecoder().decode(plaintext);
  return deserializeIntent(JSON.parse(decoded));
}

export function generateCommitmentHash(intent: Intent): string {
  const data = utf8ToBytes(
    JSON.stringify({
      id: intent.id,
      owner: intent.owner,
      intentType: intent.intentType,
      baseAsset: intent.baseAsset,
      quoteAsset: intent.quoteAsset,
      poolId: intent.poolId,
      direction: intent.direction,
      maxSize: intent.maxSize.toString(),
      minPrice: intent.minPrice?.toString(),
      maxPrice: intent.maxPrice?.toString(),
      deadline: intent.deadline,
      mevProtection: intent.mevProtection,
      createdAt: intent.createdAt,
    }),
  );

  const hash = sha256(sha256(data));
  return "0x" + bytesToHex(hash);
}

export function createEncryptedIntent(
  intent: Intent,
  solverPublicKey: Uint8Array,
): EncryptedIntent {
  const result = encryptIntent(intent, solverPublicKey);

  return {
    commitmentHash: result.commitmentHash,
    encryptedPayload: bytesToHex(result.ciphertext),
    ephemeralPublicKey: bytesToHex(result.ephemeralPublicKey),
    nonce: bytesToHex(result.nonce),
    timestamp: Date.now(),
  };
}

export function decryptEncryptedIntent(
  encrypted: EncryptedIntent,
  privateKey: Uint8Array,
): Intent {
  return decryptIntent(
    hexToBytes(encrypted.encryptedPayload),
    hexToBytes(encrypted.nonce),
    hexToBytes(encrypted.ephemeralPublicKey),
    privateKey,
  );
}

function serializeIntent(
  intent: Intent,
): Record<string, string | number | boolean | undefined> {
  return {
    id: intent.id,
    owner: intent.owner,
    intentType: intent.intentType,
    baseAsset: intent.baseAsset,
    quoteAsset: intent.quoteAsset,
    poolId: intent.poolId,
    direction: intent.direction,
    maxSize: intent.maxSize.toString(),
    minPrice: intent.minPrice?.toString(),
    maxPrice: intent.maxPrice?.toString(),
    deadline: intent.deadline,
    mevProtection: intent.mevProtection,
    createdAt: intent.createdAt,
  };
}

function deserializeIntent(
  data: Record<string, string | number | boolean | undefined>,
): Intent {
  return {
    id: data.id as string,
    owner: data.owner as string,
    intentType: data.intentType as Intent["intentType"],
    baseAsset: data.baseAsset as string,
    quoteAsset: data.quoteAsset as string,
    poolId: data.poolId as string,
    direction: data.direction as Intent["direction"],
    maxSize: BigInt(data.maxSize as string),
    minPrice: data.minPrice ? BigInt(data.minPrice as string) : undefined,
    maxPrice: data.maxPrice ? BigInt(data.maxPrice as string) : undefined,
    deadline: data.deadline as number,
    mevProtection: data.mevProtection as boolean,
    createdAt: data.createdAt as number,
  };
}

export function hexToPublicKey(hex: string): Uint8Array {
  return hexToBytes(hex.startsWith("0x") ? hex.slice(2) : hex);
}

export function publicKeyToHex(publicKey: Uint8Array): string {
  return "0x" + bytesToHex(publicKey);
}

export function verifyCommitment(
  intent: Intent,
  expectedHash: string,
): boolean {
  const computedHash = generateCommitmentHash(intent);
  return computedHash.toLowerCase() === expectedHash.toLowerCase();
}
