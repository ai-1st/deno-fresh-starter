import { assertEquals, assertMatch } from "$std/assert/mod.ts";
import {
  calculateTTL,
  composeKey,
  createSSEStream,
  decomposeKey,
  generateVersion,
  getCurrentTimestamp,
  isTTLExpired,
} from "../utils.ts";
import { DbItem } from "../types.ts";

Deno.test("utils", async (t) => {
  await t.step("createSSEStream - formats SSE messages correctly", async () => {
    const items: DbItem<string>[] = [
      { version: "1", item: "test1" },
      { version: "2", item: "test2" },
    ];

    const stream = createSSEStream(
      {
        [Symbol.asyncIterator]() {
          let index = 0;
          return {
            async next() {
              if (index >= items.length) {
                return { done: true, value: undefined };
              }
              return { done: false, value: items[index++] };
            },
          };
        },
      },
      "test-event",
    );

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    // Read first message
    const result1 = await reader.read();
    assertEquals(
      decoder.decode(result1.value),
      `event: test-event\ndata: ${JSON.stringify(items[0])}\n\n`,
    );

    // Read second message
    const result2 = await reader.read();
    assertEquals(
      decoder.decode(result2.value),
      `event: test-event\ndata: ${JSON.stringify(items[1])}\n\n`,
    );

    // Stream should end
    const result3 = await reader.read();
    assertEquals(result3.done, true);
  });

  await t.step("generateVersion - generates valid ULID", () => {
    const version = generateVersion();
    assertMatch(version, /^[0-9A-Z]{26}$/);
  });

  await t.step("composeKey/decomposeKey - handles key parts correctly", () => {
    const parts = ["USER", "123", "PROFILE"];
    const composed = composeKey(parts);
    assertEquals(composed, "USER/123/PROFILE");
    assertEquals(decomposeKey(composed), parts);
  });

  await t.step("TTL functions work correctly", async () => {
    const now = getCurrentTimestamp();
    assertEquals(typeof now, "number");
    assertEquals(Math.floor(now), now); // Should be integer

    const ttl = calculateTTL(60); // 60 seconds from now
    assertEquals(ttl, now + 60);

    // Test expired TTL
    assertEquals(isTTLExpired(now - 1), true);
    assertEquals(isTTLExpired(now + 60), false);
  });
});
