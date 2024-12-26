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
  reverse?: boolean;
  /** Maximum number of items to return */
  limit?: number;
}

/**
 * Base interface for database operations
 * Implementations must handle both Deno.KV and DynamoDB
 */
export interface DbInterface {
  /**
   * Get multiple items by their keys
   * @param keys Array of keys to fetch
   * @returns Array of found items, empty array if none found
   */
  get<T>(keys: DbItemKey[]): Promise<DbItem<T>[]>;

  /**
   * Get a single item by its key
   * @template T The type of data stored in the item
   * @param key The database item key
   * @returns The found item or undefined if not found
   */
  getOne<T>(key: DbItemKey): Promise<DbItem<T> | undefined>;

  /**
   * Set one or multiple items in a single transaction
   * For items that have versionstamp, optimistic locking is used
   * If versionstamp is null, we assume the item does not exist
   */
  set<T>(items: DbItem<T>[] | DbItem<T>): Promise<void>;

  /**
   * Update one or multiple items by merging with existing data
   * @template T The type of data stored in the items
   * @param items Items to update with their new data
   * @throws {TransactionError} If optimistic locking fails
   */
  update<T>(items: DbItem<T>[] | DbItemKey): Promise<void>;

  /**
   * Delete one or multiple items in a single transaction
   */
  delete(keys: DbItemKey[] | DbItemKey): Promise<void>;

  /**
   * Query items by primary key and optional sort key prefix
   */
  query<T>(query: DbQuery): Promise<DbItem<T>[]>;

  /**
   * Stream items by primary key and optional sort key prefix
   */
  stream<T>(query: DbQuery): ReadableStream<DbItem<T>>;
}

/**
 * Deep merge two objects or arrays
 * @param target The target object to merge into
 * @param source The source object to merge from
 * @returns The merged object
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  if (target === null || source === null) return source as T;
  if (typeof target !== 'object' || typeof source !== 'object') return source as T;

  const result = { ...target };
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key as keyof T];

    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      (result as any)[key] = [...sourceValue];
    } else if (typeof sourceValue === 'object' && typeof targetValue === 'object') {
      (result as any)[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      (result as any)[key] = sourceValue;
    }
  }
  return result;
}

/**
 * Abstract base class providing common database functionality
 */
export abstract class BaseDatabase implements DbInterface {
  abstract get<T>(keys: DbItemKey[]): Promise<DbItem<T>[]>;
  abstract set<T>(items: DbItem<T>[] | DbItem<T>): Promise<void>;
  abstract delete(keys: DbItemKey[] | DbItemKey): Promise<void>;
  abstract query<T>(query: DbQuery): Promise<DbItem<T>[]>;
  abstract stream<T>(query: DbQuery): ReadableStream<DbItem<T>>;

  /**
   * Get a single item by its key
   * @template T The type of data stored in the item
   * @param key The database item key
   * @returns The found item or undefined if not found
   */
  async getOne<T>(key: DbItemKey): Promise<DbItem<T> | undefined> {
    const items = await this.get<T>([key]);
    return items[0];
  }

  /**
   * Update one or multiple items by merging with existing data
   * @template T The type of data stored in the items
   * @param items Items to update with their new data
   * @throws {TransactionError} If optimistic locking fails
   */
  async update<T>(items: DbItem<T>[] | DbItemKey): Promise<void> {
    const itemArray = Array.isArray(items) ? items : [items];
    if (itemArray.length === 0) return;

    // Get existing items from database
    const existingItems = await this.get<T>(itemArray);
    
    // Create nested map structure for efficient lookups
    const existingMap = new Map<string, Map<string, DbItem<T>>>();
    for (const item of existingItems) {
      if (!existingMap.has(item.pk)) {
        existingMap.set(item.pk, new Map());
      }
      existingMap.get(item.pk)!.set(item.sk, item);
    }
    
    // Merge items with existing data
    const mergedItems = itemArray.map(item => {
      const existing = existingMap.get(item.pk)?.get(item.sk);
      if (!existing) return item;

      return {
        ...existing,
        data: deepMerge(existing.data as T, item.data as Partial<T>),
        ttl: item.ttl ?? existing.ttl,
      };
    });

    // Set merged items back to database
    await this.set(mergedItems);
  }
}
