/// <reference lib="deno.unstable" />

import { assertEquals, assertExists, assertRejects } from "$std/assert/mod.ts";
import { DbInterface, DbItem, TransactionError } from "../types.ts";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDatabase } from "../dynamo.ts";
import { DenoKVDatabase } from "../kv.ts";

interface TestData {
  value: string;
  balance?: number;
}

// Shared test suite for both implementations
async function runDatabaseTests(t: Deno.TestContext, db: DbInterface) {
  // Clean up before each test
  const cleanup = async () => {
    const items = [...(await db.query<TestData>({ pk: "TEST" })), ...(await db.query<TestData>({ pk: "TEST-USER" }))];
    await db.delete(items.map(({ pk, sk }) => ({ pk, sk })));
  };

  // Test key structure
  await t.step("key structure - uses string-based keys", async () => {
    const testItem: DbItem<TestData> = {
      pk: "TEST",
      sk: "123",
      data: { value: "test" }
    };
    
    await db.set(testItem);
    console.log("Trying to get item");
    const results = await db.get({ pk: "TEST", sk: "123" });
    
    assertEquals(results.length, 1);
    const result = results[0];
    assertEquals(result.pk, "TEST");
    assertEquals(result.sk, "123");
    assertEquals(result.data, testItem.data);
    assertExists(result.versionstamp);
  });

  // Test get operations
  await t.step("get - returns empty array for non-existent item", async () => {
    const results = await db.get<TestData>({ pk: "TEST", sk: "NONEXISTENT" });
    assertEquals(results.length, 0);
  });

  await t.step("get - handles multiple keys", async () => {
    const items: DbItem<TestData>[] = [
      { pk: "TEST", sk: "1", data: { value: "one" } },
      { pk: "TEST", sk: "2", data: { value: "two" } }
    ];
    await db.set(items);

    const results = await db.get<TestData>([
      { pk: "TEST", sk: "1" },
      { pk: "TEST", sk: "2" }
    ]);
    assertEquals(results.length, 2);
  });

  // Test set operations
  await t.step("set - handles version conflicts when updating an existing item", async () => {
    const key = { pk: "TEST", sk: "VERSION" };
    await db.set({ ...key, data: { value: "initial" } });
    
    // Get the item with its version
    const [item1] = await db.get<TestData>(key);
    const [item2] = await db.get<TestData>(key);
    assertExists(item1);
    assertExists(item2);

    item1.data = { value: "updated1" };
    await db.set(item1);
  
    item2.data = { value: "updated2" };
    // Try to overwrite
    await assertRejects(
      () => db.set(item2),
      TransactionError
    );

    const [updated] = await db.get<TestData>(key);
    assertEquals(updated.data?.value, "updated1");
  });

  await t.step("set - handles version conflicts when creating a new item", async () => {
    const key = { pk: "TEST", sk: "NEW-ITEM" };
    const item1 = { ...key, data: { value: "item1" }, versionstamp: null };
    const item2 = { ...key, data: { value: "item2" }, versionstamp: null };

    await db.set(item1);
    // Try to overwrite
    await assertRejects(
      () => db.set(item2),
      TransactionError
    );

    const [updated] = await db.get<TestData>(key);
    assertEquals(updated.data?.value, "item1");
  });

  // Test TTL support
  // await t.step("ttl - item expires after specified duration", async () => {
  //   const key = { pk: "TEST", sk: "TTL" };
  //   await db.set({
  //     ...key,
  //     data: { value: "test" },
  //     ttl: 1 // 1ms TTL
  //   });
    
  //   await new Promise((resolve) => setTimeout(resolve, 150)); // Wait 0.15 seconds
    
  //   const results = await db.get<TestData>(key);
  //   assertEquals(results.length, 0);
  // });

  // Test query operations
  await t.step("query - returns empty array for no matches", async () => {
    const results = await db.query<TestData>({ pk: "TEST-NONEXISTENT" });
    assertEquals(results.length, 0);
  });

  await t.step("query - returns matching items", async () => {
    await cleanup();

    const items: DbItem<TestData>[] = [
      { pk: "TEST-USER", sk: "1", data: { value: "one" } },
      { pk: "TEST-USER", sk: "2", data: { value: "two" } },
      { pk: "TEST-OTHER", sk: "1", data: { value: "other" } }
    ];
    await db.set(items);

    const results = await db.query<TestData>({ pk: "TEST-USER" });
    assertEquals(results.length, 2);
  });

  await t.step("query - respects options", async () => {
    await cleanup();

    const items: DbItem<TestData>[] = [
      { pk: "TEST-USER", sk: "1", data: { value: "one" } },
      { pk: "TEST-USER", sk: "2", data: { value: "two" } },
      { pk: "TEST-USER", sk: "3", data: { value: "three" } }
    ];
    await db.set(items);

    const results = await db.query<TestData>({
      pk: "TEST-USER",
      limit: 2,
      reverse: true
    });
    assertEquals(results.length, 2);
    assertEquals(results[0].data?.value, "three");
  });

  // Test streaming
  await t.step("stream - streams items correctly", async () => {
    await cleanup();

    const items: DbItem<TestData>[] = [
      { pk: "TEST-STREAM", sk: "1", data: { value: "one" } },
      { pk: "TEST-STREAM", sk: "2", data: { value: "two" } }
    ];
    await db.set(items);

    const stream = db.stream<TestData>({ pk: "TEST-STREAM" });
    const reader = stream.getReader();
    const results: DbItem<TestData>[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      results.push(value);
    }

    assertEquals(results.length, 2);
  });

  // Clean up after all tests
  await cleanup();
}

// Run tests for Deno KV implementation
Deno.test("DenoKVDatabase", async (t) => {
  const kv = await Deno.openKv();
  const db = new DenoKVDatabase(kv);
  await runDatabaseTests(t, db);
  await kv.close();
});

// Run tests for DynamoDB implementation 
Deno.test("DynamoDBDatabase", async (t) => {
  const client = new DynamoDBClient({});
  const db = new DynamoDBDatabase(client, "TEST");
  await runDatabaseTests(t, db);
  client.destroy();
});

