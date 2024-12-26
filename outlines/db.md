# Database Design

## Overview

This project uses a flexible database interface that can work with either Deno.KV or DynamoDB, determined by the deployment platform:

- Deno.KV for Deno Deploy and local development
- DynamoDB when deployed to AWS

This abstraction allows for seamless deployment to either platform while maintaining the same application logic.

## Key Design Principles

1. **Single Table Design**: Following DynamoDB best practices, we use a single table with composite keys (PK/SK)
2. **Consistent Interface**: Same API regardless of the underlying database
3. **Optimistic Locking**: All items include a version for optimistic concurrency control
4. **TTL Support**: Optional Time-To-Live for items
5. **Atomic Operations**: Support for transaction-like atomic operations
6. **Streaming Support**: Query operations support both batch results and SSE streaming
7. **Type Safety**: Full TypeScript support with generic types

## Key Structure

- Primary Key (PK) and Sort Key (SK) are strings

Example:

```typescript
// User profile
pk: "USER";
sk: "1233";

// Post by this user
pk: "POST-BY-USER/1233";
sk: "2023-10-10T12:34:56Z";
```

## Database Interface

```typescript
interface DbItemKey {
  pk: string;
  sk: string;
}

interface DbItem<T> extends DbItemKey {
  data?: T;
  versionstamp?: string | null; // format is DB-specific
  ttl?: number; // number of milliseconds in which the item will expire
}

interface DbQuery {
  pk: string,
  sk?: string,
  reverse?: boolean;
  limit?: number;
}

// Generalized database interface
interface DbInterface {
  // Get multiple items by their keys
  get<T>(keys: DbItemKey[]): Promise<DbItem<T>[]>;

  // Get a single item by its key
  // Returns undefined if not found
  getOne<T>(key: DbItemKey): Promise<DbItem<T> | undefined>;

  // Set one or multiple items in a single transaction
  // For items that have versionstamp, optimistic locking is used
  // If versionstamp is null, we assume the item does not exist
  set<T>(items: DbItem<T>[] | DbItem<T>): Promise<void>;

  // Update one or multiple items by merging with existing data
  // Deep merges the data field, preserves other fields
  // For items that have versionstamp, optimistic locking is used
  // Can accept either a single item/key or an array
  update<T>(items: DbItem<T>[] | DbItemKey): Promise<void>;

  // Delete one or multiple items in a single transaction
  delete(keys: DbItemKey[] | DbItemKey<T>): Promise<void>;

  // Query items by PK and optional SK prefix
  // If SK is empty, queries by PK only
  query<T>(query: DbQuery): Promise<DbItem<T>[]>;

  // Stream items by PK and optional SK prefix
  stream<T>(query: DbQuery): ReadableStream<DbItem<T>>;
}

// Base class providing common functionality
abstract class BaseDatabase implements DbInterface {
  // Abstract methods that must be implemented
  abstract get<T>(keys: DbItemKey[]): Promise<DbItem<T>[]>;
  abstract set<T>(items: DbItem<T>[] | DbItem<T>): Promise<void>;
  abstract delete(keys: DbItemKey[] | DbItemKey): Promise<void>;
  abstract query<T>(query: DbQuery): Promise<DbItem<T>[]>;
  abstract stream<T>(query: DbQuery): ReadableStream<DbItem<T>>;

  // Convenience methods with default implementations
  async getOne<T>(key: DbItemKey): Promise<DbItem<T> | undefined> {
    const items = await this.get<T>([key]);
    return items[0];
  }

  async update<T>(items: DbItem<T>[] | DbItemKey): Promise<void> {
    if (Array.isArray(items)) {
      if (items.length === 0) return;
      const existingItems = await this.get<T>(items);
      
      // Create nested map for efficient lookups
      const existingMap = new Map<string, Map<string, DbItem<T>>>();
      for (const item of existingItems) {
        if (!existingMap.has(item.pk)) {
          existingMap.set(item.pk, new Map());
        }
        existingMap.get(item.pk)!.set(item.sk, item);
      }
      
      // Deep merge items with existing data
      const mergedItems = items.map(item => {
        const existing = existingMap.get(item.pk)?.get(item.sk);
        if (!existing) return item;

        return {
          ...existing,
          data: deepMerge(existing.data as T, item.data as Partial<T>),
          ttl: item.ttl ?? existing.ttl,
        };
      });

      await this.set(mergedItems);
    } else {
      const existingItem = await this.getOne<T>(items);
      if (!existingItem) return;

      const mergedItem = {
        ...existingItem,
        data: deepMerge(existingItem.data as T, items.data as Partial<T>),
        ttl: items.ttl ?? existingItem.ttl,
      };

      await this.set(mergedItem);
    }
  }
}

// Helper function for creating SSE streams
function createSSEStream<T>(
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
```

## Usage Examples

### Setup

```typescript
import { db } from "$db";
```

### Basic Operations


```typescript
// Get a single item
const user = await db.getOne<UserProfile>({
  pk: "USER",
  sk: userId
});

// Get multiple items
const posts = await db.get<Post>([
  { pk: "POST", sk: "123" },
  { pk: "POST", sk: "456" }
]);

// Update an item with partial data (merges with existing)
await db.update<UserProfile>({
  pk: "USER",
  sk: userId,
  data: {
    preferences: { theme: "dark" } // Only updates theme, preserves other preferences
  }
});

// Update multiple items atomically
await db.update<Post>([
  { pk: "POST", sk: "123", data: { title: "Hello" } },
  { pk: "POST", sk: "456", data: { title: "World" } }
]);

// Set multiple items atomically (overwrites existing)
await db.set<Post>([
  { pk: "POST", sk: "123", data: { title: "Hello" } },
  { pk: "POST", sk: "456", data: { title: "World" } }
]);

// Query with streaming
const stream = db.stream<Event>({
  pk: "EVENTS",
  sk: "2023-"
});

// Delete items
await db.delete([
  { pk: "POST", sk: "123" },
  { pk: "POST", sk: "456" }
]);
```

### Query Operations

```typescript
// Query all user settings
const orders = await db.query({
  pk: "ORDERS-BY-DATE",
  sk: "2023-10-10",
  limit: 10,
});

// Query in reverse order
const recentOrders = await db.query({
  pk: "ORDERS-BY-DATE",
  reverse: true,
  limit: 5,
});

// Stream updates in real-time using SSE
const stream = db.stream({
  pk: "ORDERS-BY-DATE",
  sk: "2023-10-10",
  reverse: true,
});

// Convert to SSE stream for web clients
const sseStream = createSSEStream(stream, "update");
```

### Items with TTL

```typescript
// Create a temporary session that expires in 24 hours
await db.set({
  pk: ["SESSION", sessionId],
  sk: ["DATA"],
  data: { userId, lastActive: Date.now() },
  ttl: 24 * 60 * 60 * 1000  // 24 hours in milliseconds
});
```

### Implementation Selection

The database implementation is selected based on the env value with a default of "kv".

```typescript
const db = createDb(Deno.env.has("DB") ? Deno.env.get("DB")! : "kv");
```

### Deno.KV Implementation

### TTL Support

Deno KV supports key expiration, allowing developers to control time to live (TTL) for keys in a KV database. This allows an expiration timestamp to be associated with a key, after which the key will be automatically deleted from the database:

```typescript 
const kv = await Deno.openKv();

// `expireIn` is the number of milliseconds after which the key will expire.
function addSession(session: Session, expireIn: number) {
  await kv.set(["sessions", session.id], session, { expireIn });
}
```


## DynamoDB Implementation Details

### versionstamp

DynamoDB doesn't automatically assign versionstamps to items, so we need to add them manually. We'll use the `versionstamp` field to store the versionstamps for each item. The value will be a ulid generated by the client library.

### Data Types
The data is stored as a JSON string in DynamoDB. This allows for flexible and complex data structures to be stored in the database.

### Setup

1. Add AWS SDK dependencies in deno.json:

```json
{
  "imports": {
    "@aws-sdk/": "npm:/@aws-sdk/"
  }
}
```

2. Required AWS SDK modules:

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
```

3. Create a test table using AWS CLI:

```bash
aws dynamodb create-table \
  --table-name TEST \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

  aws dynamodb update-time-to-live \
    --table-name TEST \
    --time-to-live-specification \
        "Enabled=true, AttributeName=ttl"
```

4. Client Configuration

```typescript
const client = new DynamoDBClient({
  region: Deno.env.get("AWS_REGION") || "us-east-1",
});

// Use the document client for simpler interactions
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
```

### Optimistic Locking Implementation

```typescript
// Import necessary AWS SDK clients and commands
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { GetItemCommand, UpdateItemCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "us-east-1" });

async function updateItemWithOptimisticLocking(tableName, key, updateData) {
  try {
    // Step 1: Get the current item
    const getItemParams = {
      TableName: tableName,
      Key: key,
    };
    const { Item } = await client.send(new GetItemCommand(getItemParams));

    if (!Item) {
      throw new Error("Item not found");
    }

    // Step 2: Prepare update parameters
    const currentVersionStamp = Item.versionstamp;
    const updatedVersionStamp = generateVersion();

    const updateParams = {
      TableName: tableName,
      Key: key,
      UpdateExpression: "SET #data = :data, #versionstamp = :newVersionStamp",
      ConditionExpression: "#versionstamp = :currentVersionStamp",
      ExpressionAttributeNames: {
        "#data": "data", // Assuming 'data' is the attribute you want to update
        "#versionstamp": "versionstamp",
      },
      ExpressionAttributeValues: {
        ":data": updateData,
        ":newVersionStamp": updatedVersionStamp,
        ":currentVersionStamp": currentVersionStamp,
      },
    };

    // Step 3: Update item with optimistic locking
    await client.send(new UpdateItemCommand(updateParams));
    console.log("Update successful");
  } catch (error) {
    console.error("Update failed:", error.message);
  }
}

// Usage example
updateItemWithOptimisticLocking(
  "YourTableName",
  { id: "item-id" },
  { newValue: "newData" }
);
```

### Query Operations Implementation

DynamoDB paginates the results from Query operations. With pagination, the Query results are divided into "pages" of data that are 1 MB in size (or less). An application can process the first page of results, then the second page, and so on.

A single Query only returns a result set that fits within the 1 MB size limit. To determine whether there are more results, and to retrieve them one page at a time, applications should do the following:

1. Examine the low-level Query result:

* If the result contains a LastEvaluatedKey element and it's non-null, proceed to step 2.

* If there is not a LastEvaluatedKey in the result, there are no more items to be retrieved.

2. Construct a new Query request, with the same parameters as the previous one. However, this time, take the LastEvaluatedKey value from step 1 and use it as the ExclusiveStartKey parameter in the new Query request.

3. Run the new Query request.

4. Go to step 1.

In other words, the LastEvaluatedKey from a Query response should be used as the ExclusiveStartKey for the next Query request. If there is not a LastEvaluatedKey element in a Query response, then you have retrieved the final page of results. If LastEvaluatedKey is not empty, it does not necessarily mean that there is more data in the result set. The only way to know when you have reached the end of the result set is when LastEvaluatedKey is empty.
