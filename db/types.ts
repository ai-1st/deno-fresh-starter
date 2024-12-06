// Error types for database operations
export class TransactionError extends Error {
  constructor() {
    super("Transaction failed");
    this.name = "TransactionError";
  }
}

/**
 * Database item key structure
 */
export interface DbItemKey {
  /** Primary key */
  pk: string;
  /** Sort key */
  sk: string;
}

/**
 * Generic database item with versioning and TTL
 * @template T The type of data stored in the item
 */
export interface DbItem<T> extends DbItemKey {
  /** The actual data stored in the item */
  data?: T;

  /** Database-specific version stamp for optimistic locking */
  versionstamp?: string | null;

  /** 
   * Time-to-live in milliseconds from now
   * When set, the item will be automatically deleted after this duration
   */
  ttl?: number;
}

/**
 * Query options for database operations
 */
export interface DbQuery {
  /** Primary key to query */
  pk: string;
  /** Optional sort key prefix */
  sk?: string;
  /** If true, returns results in reverse order */
  reversed?: boolean;
  /** Maximum number of items to return */
  limit?: number;
}

/**
 * Base interface for database operations
 * Implementations must handle both Deno.KV and DynamoDB
 */
export interface DbInterface {
  /**
   * Get one or multiple items by their keys
   * @returns Array of found items, empty array if none found
   */
  get<T>(keys: DbItemKey[] | DbItemKey): Promise<DbItem<T>[]>;

  /**
   * Set one or multiple items in a single transaction
   * For items that have versionstamp, optimistic locking is used
   * If versionstamp is null, we assume the item does not exist
   */
  set<T>(items: DbItem<T>[] | DbItem<T>): Promise<void>;

  /**
   * Delete one or multiple items in a single transaction
   */
  delete(keys: DbItemKey[] | DbItemKey): Promise<void>;

  /**
   * Query items by primary key and optional sort key prefix
   * If sort key is empty, queries by primary key only
   */
  query<T>(query: DbQuery): Promise<DbItem<T>[]>;

  /**
   * Stream items by primary key and optional sort key prefix
   * Useful for SSE (Server-Sent Events) streaming
   */
  stream<T>(query: DbQuery): ReadableStream<DbItem<T>>;
}

/**
 * Helper function for creating SSE streams from database items
 */
export function createSSEStream<T>(
  iter: AsyncIterable<DbItem<T>>,
  eventType: string,
): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const item of iter) {
          const event = `event: ${eventType}\ndata: ${JSON.stringify(item)}\n\n`;
          controller.enqueue(enc.encode(event));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
