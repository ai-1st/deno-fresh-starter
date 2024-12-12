import { crypto } from "$std/crypto/mod.ts";

/**
 * Hash a password using PBKDF2 with SHA-256
 * @param password The password to hash
 * @param salt The salt to use (usually the user's login)
 * @returns The hashed password as a hex string
 */
export async function hashPassword(
  password: string,
  salt: string,
): Promise<string> {
  // Convert password and salt to Uint8Array
  const passwordBuffer = new TextEncoder().encode(password);
  const saltBuffer = new TextEncoder().encode(salt);

  // Use PBKDF2 to derive a key
  const key = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256, // 32 bytes
  );

  // Convert to hex string
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
