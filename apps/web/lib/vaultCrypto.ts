/**
 * Client-Side Zero-Knowledge Cryptographic Utilities for Finease Credential Vault
 * Powered by native Web Crypto API (AES-256-GCM & PBKDF2 with SHA-256).
 */

export const VAULT_SENTINEL = "FINEASE_VAULT_OK";

/**
 * Converts ArrayBuffer / Uint8Array to Base64 string
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates cryptographically secure random Base64 salt (default 16 bytes)
 */
export function generateSalt(byteLength: number = 16): string {
  const array = new Uint8Array(byteLength);
  window.crypto.getRandomValues(array);
  return bufferToBase64(array);
}

/**
 * Generates cryptographically secure random Base64 IV (default 12 bytes for AES-GCM)
 */
export function generateIv(byteLength: number = 12): string {
  const array = new Uint8Array(byteLength);
  window.crypto.getRandomValues(array);
  return bufferToBase64(array);
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a Master Password and Salt using PBKDF2
 */
export async function deriveVaultKey(
  masterPassword: string,
  saltBase64: string,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = base64ToBuffer(saltBase64);

  // Import raw password into key material
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Derive AES-GCM 256-bit key
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts UTF-8 plain text using AES-256-GCM with a specified IV
 * Returns Base64 ciphertext
 */
export async function encryptText(
  plainText: string,
  key: CryptoKey,
  ivBase64: string,
): Promise<string> {
  if (!plainText) return "";
  const enc = new TextEncoder();
  const iv = base64ToBuffer(ivBase64);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    enc.encode(plainText),
  );

  return bufferToBase64(encryptedBuffer);
}

/**
 * Decrypts Base64 ciphertext using AES-256-GCM with the specified IV
 * Returns decrypted UTF-8 plain text string
 */
export async function decryptText(
  cipherTextBase64: string,
  key: CryptoKey,
  ivBase64: string,
): Promise<string> {
  if (!cipherTextBase64) return "";
  try {
    const dec = new TextDecoder();
    const iv = base64ToBuffer(ivBase64);
    const cipherBuffer = base64ToBuffer(cipherTextBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as BufferSource,
      },
      key,
      cipherBuffer as BufferSource,
    );

    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt: invalid key or corrupted data");
  }
}

/**
 * Initializes setup for a new vault:
 * Generates salt, derives key, and encrypts sentinel token for validation.
 */
export async function setupNewVault(masterPassword: string): Promise<{
  vaultSalt: string;
  passwordVerifier: string;
  verifierIv: string;
  key: CryptoKey;
}> {
  const vaultSalt = generateSalt(16);
  const verifierIv = generateIv(12);
  const key = await deriveVaultKey(masterPassword, vaultSalt);
  const passwordVerifier = await encryptText(VAULT_SENTINEL, key, verifierIv);

  return {
    vaultSalt,
    passwordVerifier,
    verifierIv,
    key,
  };
}

/**
 * Verifies if the provided Master Password can decrypt the stored verifier.
 * Returns the derived CryptoKey on success, or null on incorrect password.
 */
export async function verifyMasterPassword(
  masterPassword: string,
  vaultSalt: string,
  passwordVerifier: string,
  verifierIv: string,
): Promise<CryptoKey | null> {
  try {
    const key = await deriveVaultKey(masterPassword, vaultSalt);
    const decrypted = await decryptText(passwordVerifier, key, verifierIv);
    if (decrypted === VAULT_SENTINEL) {
      return key;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates a strong, random password with custom criteria
 */
export function generateSecurePassword(
  options: {
    length?: number;
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {},
): string {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  const upperChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude I, O for readability
  const lowerChars = "abcdefghijkmnopqrstuvwxyz"; // exclude l for readability
  const numberChars = "23456789"; // exclude 0, 1 for readability
  const symbolChars = "!@#$%^&*()-_=+[]{}";

  let charPool = "";
  let guaranteedChars = "";

  if (uppercase) {
    charPool += upperChars;
    guaranteedChars +=
      upperChars[Math.floor(Math.random() * upperChars.length)];
  }
  if (lowercase) {
    charPool += lowerChars;
    guaranteedChars +=
      lowerChars[Math.floor(Math.random() * lowerChars.length)];
  }
  if (numbers) {
    charPool += numberChars;
    guaranteedChars +=
      numberChars[Math.floor(Math.random() * numberChars.length)];
  }
  if (symbols) {
    charPool += symbolChars;
    guaranteedChars +=
      symbolChars[Math.floor(Math.random() * symbolChars.length)];
  }

  if (!charPool) charPool = lowerChars + numberChars;

  const remainingLength = Math.max(0, length - guaranteedChars.length);
  const randomBytes = new Uint32Array(remainingLength);
  window.crypto.getRandomValues(randomBytes);

  let result = guaranteedChars;
  for (let i = 0; i < remainingLength; i++) {
    const rand = randomBytes[i] ?? 0;
    const char = charPool[rand % charPool.length];
    if (char) {
      result += char;
    }
  }

  // Shuffle the password characters
  return result
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}
