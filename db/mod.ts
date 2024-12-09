import { DbInterface } from "./types.ts";
import { DenoKVDatabase } from "./kv.ts";
import { DynamoDBDatabase } from "./dynamo.ts";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export * from "./types.ts";

// Factory function to create the appropriate database implementation
export async function createDb(type: string = "kv"): Promise<DbInterface> {
  switch (type.toLowerCase()) {
    case "kv":
      const kv = await Deno.openKv();
      return new DenoKVDatabase(kv);

    case "aws":
      if (!Deno.env.has("AWS_REGION") || !Deno.env.has("DYNAMODB_TABLE")) {
        throw new Error(
          "AWS_REGION and DYNAMODB_TABLE environment variables are required for DynamoDB",
        );
      }

      const client = new DynamoDBClient({
        region: Deno.env.get("AWS_REGION")!,
        credentials: {
          accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
          secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
        },
      });

      return new DynamoDBDatabase(client, Deno.env.get("DYNAMODB_TABLE")!);

    default:
      throw new Error(`Unknown database type: ${type}`);
  }
}

export const db = await createDb("kv")