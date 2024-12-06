import { ulid } from "$ulid/mod.ts";
import { DbItem } from "./types.ts";

// Helper function for creating SSE streams
export function createSSEStream<T>(
  iter: AsyncIterable<DbItem<T>>,
  eventType: string
): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();

  async function* gen() {
    for await (const item of iter) {
      const event = `event: ${eventType}\ndata: ${JSON.stringify(item)}\n\n`;
      yield enc.encode(event);
    }
  }

  return ReadableStream.from(gen());
}

// Generate a new version ID using ULID
export function generateVersion(): string {
  return ulid();
}

// Compose a DynamoDB-style key from parts
export function composeKey(parts: string[]): string {
  return parts.join("/");
}

// Decompose a DynamoDB-style key into parts
export function decomposeKey(key: string): string[] {
  return key.split("/");
}

// Get current timestamp in seconds
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// Calculate TTL timestamp from duration in seconds
export function calculateTTL(durationSeconds: number): number {
  return getCurrentTimestamp() + durationSeconds;
}

