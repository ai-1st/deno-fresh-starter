import { assertEquals, assertRejects } from "$std/assert/mod.ts";
import { createDb } from "../mod.ts";
import { DbInterface } from "../types.ts";

Deno.test({
  name: "createDb",
  async fn(t) {
    let currentDb: DbInterface | undefined;

    const cleanup = async () => {
      if (currentDb && "close" in currentDb) {
        await (currentDb as { close(): Promise<void> }).close();
        currentDb = undefined;
      }
    };

    try {
      await t.step({
        name: "creates Deno.KV database by default",
        async fn() {
          await cleanup();
          currentDb = await createDb();
          assertEquals(typeof currentDb.put, "function");
          assertEquals(typeof currentDb.get, "function");
          assertEquals(typeof currentDb.query, "function");
          assertEquals(typeof currentDb.stream, "function");
        },
      });

      await t.step({
        name: "creates Deno.KV database with 'kv' type",
        async fn() {
          await cleanup();
          currentDb = await createDb("kv");
          assertEquals(typeof currentDb.put, "function");
        },
      });

      await t.step({
        name: "fails to create DynamoDB without required env vars",
        async fn() {
          await assertRejects(
            () => createDb("aws"),
            Error,
            "AWS_REGION and DYNAMODB_TABLE environment variables are required",
          );
        },
      });

      await t.step({
        name: "fails with unknown database type",
        async fn() {
          await assertRejects(
            () => createDb("unknown"),
            Error,
            "Unknown database type: unknown",
          );
        },
      });
    } finally {
      await cleanup();
    }
  },
});
