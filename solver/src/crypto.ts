import { x25519 } from "@noble/curves/ed25519";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils";
import type { DecryptedIntent, EncryptedIntent, Intent } from "./types.js";
import { IntentSchema } from "./types.js";

export class IntentDecryptor {
  private readonly privateKey: Uint8Array;
  private readonly publicKey: Uint8Array;

  constructor(privateKeyHex: string) {
    this.privateKey = hexToBytes(privateKeyHex);
    this.publicKey = x25519.getPublicKey(this.privateKey);
  }

  getPublicKeyHex(): string {
    return bytesToHex(this.publicKey);
  }

  decrypt(encrypted: EncryptedIntent, userAddress: string): DecryptedIntent {
    const ephemeralPublicKey = hexToBytes(encrypted.ephemeralPublicKey);
    const nonce = hexToBytes(encrypted.nonce);
    const ciphertext = hexToBytes(encrypted.ciphertext);

    const sharedSecret = x25519.getSharedSecret(
      this.privateKey,
      ephemeralPublicKey,
    );
    const key = sha256(sharedSecret);

    const cipher = xchacha20poly1305(key, nonce);
    const decrypted = cipher.decrypt(ciphertext);

    const jsonString = new TextDecoder().decode(decrypted);
    const parsed = JSON.parse(jsonString);
    const intent = IntentSchema.parse(parsed.intent);

    const computedCommitment = this.computeCommitment(intent);
    if (computedCommitment !== encrypted.commitment) {
      throw new Error("Intent commitment mismatch - data may be tampered");
    }

    return {
      intent,
      commitment: encrypted.commitment,
      userAddress,
      timestamp: parsed.timestamp || Date.now(),
    };
  }

  private computeCommitment(intent: Intent): string {
    const intentJson = JSON.stringify(intent);
    const firstHash = sha256(utf8ToBytes(intentJson));
    const secondHash = sha256(firstHash);
    return bytesToHex(secondHash);
  }

  verifyCommitment(intent: Intent, expectedCommitment: string): boolean {
    const computed = this.computeCommitment(intent);
    return computed === expectedCommitment;
  }
}
