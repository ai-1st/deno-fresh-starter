import {
  DbInterface,
  DbItem,
  DbItemKey,
  DbQuery,
  TransactionError,
} from "./types.ts";
import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  QueryCommandInput,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ulid } from "$ulid/mod.ts";

/**
 * DynamoDB implementation of the database interface
 */
export class DynamoDBDatabase implements DbInterface {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client: DynamoDBClient, tableName: string) {
    this.client = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  /**
   * Get one or multiple items by their keys
   */
  async get<T>(keys: DbItemKey[] | DbItemKey): Promise<DbItem<T>[]> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const results: DbItem<T>[] = [];

    // DynamoDB doesn't have a batch get operation that matches our needs exactly
    // so we'll do multiple gets in parallel
    const promises = keyArray.map(async (key) => {
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: {
          pk: { S: key.pk },
          sk: { S: key.sk },
        },
      });

      const result = await this.client.send(command);
      if (result.Item) {
        const item = this.fromDynamoDBItem<T>(result.Item);
        if (item) results.push(item);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Set one or multiple items in a single transaction
   */
  async set<T>(items: DbItem<T>[] | DbItem<T>): Promise<void> {
    const itemArray = Array.isArray(items) ? items : [items];
    if (itemArray.length === 0) return;

    const transactItems = itemArray.map((item) => {
      if (item.versionstamp === null) {
        return {
          Put: {
            TableName: this.tableName,
            Item: this.toDynamoDBItem(item),
            ConditionExpression:
              "attribute_not_exists(pk) AND attribute_not_exists(sk)",
          },
        };
      } else if (item.versionstamp) {
        return {
          Update: {
            TableName: this.tableName,
            Key: {
              pk: { S: item.pk },
              sk: { S: item.sk } 
            },
            UpdateExpression: "SET #data = :data, #versionstamp = :newVersion" +
              (item.ttl ? ", #ttl = :ttl" : ""),
            ConditionExpression: "#versionstamp = :oldVersion",
            ExpressionAttributeNames: {
              "#data": "data",
              "#versionstamp": "versionstamp",
              ...(item.ttl !== undefined ? { "#ttl": "ttl" } : {}),
            },
            ExpressionAttributeValues: {
              ":data": { S: JSON.stringify(item.data) },
              ":newVersion": { S: ulid() },
              ":oldVersion": { S: item.versionstamp },
              ...(item.ttl !== undefined ? { ":ttl": { N: item.ttl.toString() } } : {})
            }
          }
        };
      } else {
        return {
          Put: {
            TableName: this.tableName,
            Item: this.toDynamoDBItem(item),
          },
        };
      }
    });

    try {
      await this.client.send(
        new TransactWriteItemsCommand({ TransactItems: transactItems }),
      );
    } catch (error) {
      if (
        error instanceof Error && error.name === "TransactionCanceledException"
      ) {
        throw new TransactionError();
      }
      throw error;
    }
  }

  /**
   * Delete one or multiple items in a single transaction
   */
  async delete(keys: DbItemKey[] | DbItemKey): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.length === 0) return;

    const transactItems = keyArray.map((key) => ({
      Delete: {
        TableName: this.tableName,
        Key: {
          pk: { S: key.pk },
          sk: { S: key.sk },
        },
      },
    }));

    try {
      await this.client.send(
        new TransactWriteItemsCommand({ TransactItems: transactItems }),
      );
    } catch (error) {
      if (
        error instanceof Error && error.name === "TransactionCanceledException"
      ) {
        throw new TransactionError();
      }
      throw error;
    }
  }

  /**
   * Query items by primary key and optional sort key prefix
   * Handles pagination to fetch all results across multiple pages
   */
  async query<T>(query: DbQuery): Promise<DbItem<T>[]> {
    const allItems: DbItem<T>[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;
    let itemCount = 0;
    const TableName = this.tableName;

    do {
      const params: QueryCommandInput = {
        TableName,
        KeyConditionExpression: query.sk
          ? "pk = :p and begins_with(sk, :s)"
          : "pk = :p",
        ExpressionAttributeValues: marshall({
          ":p": query.pk,
          ...(query.sk && { ":s": query.sk }),
        }),
        ScanIndexForward: !(query.reverse ?? false),
        ...(query.limit && { Limit: Math.min(query.limit - itemCount, 1000) }),
        ...(lastEvaluatedKey &&
          { ExclusiveStartKey: marshall(lastEvaluatedKey) }),
      };

      try {
        const command = new QueryCommand(params);
        const { Items = [], LastEvaluatedKey } = await this.client.send(
          command,
        );

        const pageItems = Items
          .map((item) => this.fromDynamoDBItem<T>(item));

        allItems.push(...pageItems);
        itemCount += pageItems.length;

        // Update the last evaluated key for the next page
        lastEvaluatedKey = LastEvaluatedKey
          ? unmarshall(LastEvaluatedKey)
          : undefined;

        // Break if we've reached the requested limit
        if (query.limit && itemCount >= query.limit) {
          break;
        }
      } catch (error) {
        console.error("Error querying items:", error);
        throw error;
      }
    } while (lastEvaluatedKey); // Continue until no more pages

    return allItems;
  }

  /**
   * Stream items by primary key and optional sort key prefix
   * Uses pagination to efficiently stream large result sets
   */
  stream<T>(query: DbQuery): ReadableStream<DbItem<T>> {
    const TableName = this.tableName;
    const fromDynamoDBItem = this.fromDynamoDBItem;
    const client = this.client;
    return new ReadableStream({
      async start(controller) {
        let lastEvaluatedKey: Record<string, any> | undefined;

        do {
          const params: QueryCommandInput = {
            TableName,
            KeyConditionExpression: query.sk
              ? "pk = :p and begins_with(sk, :s)"
              : "pk = :p",
            ExpressionAttributeValues: marshall({
              ":p": query.pk,
              ...(query.sk && { ":s": query.sk }),
            }),
            ScanIndexForward: !(query.reverse ?? false),
            ...(query.limit && { Limit: query.limit }),
            ...(lastEvaluatedKey &&
              { ExclusiveStartKey: marshall(lastEvaluatedKey) }),
          };

          try {
            const command = new QueryCommand(params);
            const { Items = [], LastEvaluatedKey } = await client.send(command);

            const items = Items.map((item) => fromDynamoDBItem<T>(item));

            for (const item of items) {
              controller.enqueue(item);
            }

            lastEvaluatedKey = LastEvaluatedKey
              ? unmarshall(LastEvaluatedKey)
              : undefined;
          } catch (error) {
            console.error("Error streaming items:", error);
            controller.error(error);
            break;
          }
        } while (lastEvaluatedKey && (!query.limit || query.limit > 0));

        controller.close();
      },

      cancel() {
        console.log("Stream cancelled by consumer");
      },
    });
  }

  /**
   * Convert DynamoDB item to our DbItem format
   */
  private fromDynamoDBItem<T>(item: Record<string, any>): DbItem<T> {
    return {
      pk: item.pk.S,
      sk: item.sk.S,
      data: JSON.parse(item.data.S),
      versionstamp: item.versionstamp.S,
      ttl: item.ttl && item.ttl.N,
    };
  }

  /**
   * Convert our DbItem to DynamoDB format
   */
  private toDynamoDBItem<T>(item: DbItem<T>): Record<string, any> {
    const versionstamp = item.versionstamp
      ? { S: item.versionstamp }
      : { S: ulid() };
    return {
      pk: { S: item.pk },
      sk: { S: item.sk },
      versionstamp,
      data: { S: JSON.stringify(item.data) },
      ...(item.ttl && { ttl: { N: item.ttl.toString() } }),
    };
  }
}
