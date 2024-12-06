import {
  DbInterface,
  DbItem,
  DbItemKey,
  DbQuery,
  TransactionError,
} from "./types.ts";

/**
 * Deno KV implementation of the database interface
 * Uses native Deno.KV for storage with built-in atomic operations
 */
export class DenoKVDatabase implements DbInterface {
  private kv: Deno.Kv;

  constructor(kv: Deno.Kv) {
    this.kv = kv;
  }

  /**
   * Create a KV key from primary key and sort key components
   */
  private createKey(key: DbItemKey): Deno.KvKey {
    return [key.pk, key.sk];
  }

  /**
   * Get one or multiple items by their keys
   */
  async get<T>(keys: DbItemKey[] | DbItemKey): Promise<DbItem<T>[]> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const results: DbItem<T>[] = [];

    // Batch get all items
    const kvKeys = keyArray.map((key) => this.createKey(key));
    const entries = await this.kv.getMany<T[]>(kvKeys);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.value) {
        results.push({
          pk: entry.key[0] as string,
          sk: entry.key[1] as string,
          data: entry.value as T,
          versionstamp: `${entry.versionstamp}`, // convert to string
        });
      }
    }

    return results;
  }

  /**
   * Set one or multiple items in a single transaction
   * For items that have versionstamp, optimistic locking is used
   * If versionstamp is null, we assume the item does not exist
   */
  async set<T>(items: DbItem<T>[] | DbItem<T>): Promise<void> {
    const itemArray = Array.isArray(items) ? items : [items];
    if (itemArray.length === 0) return;

    const atomic = this.kv.atomic();

    for (const item of itemArray) {
      const key = this.createKey(item);
      
      // If item has a versionstamp, check it
      if (item.versionstamp !== undefined) {
        atomic.check({ key, versionstamp: item.versionstamp });
      } 

      // Set the item with TTL if specified
      atomic.set(key, item.data, item.ttl ? { expireIn: item.ttl } : {});
    }

    try {
      const result = await atomic.commit();
      if (!result.ok) {
        throw new TransactionError();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete one or multiple items in a single transaction
   */
  async delete(keys: DbItemKey[] | DbItemKey): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.length === 0) return;

    const atomic = this.kv.atomic();

    for (const key of keyArray) {
      const kvKey = this.createKey(key);
      atomic.delete(kvKey);
    }

    const result = await atomic.commit();
    if (!result.ok) {
      throw new TransactionError();
    }
  }

  /**
   * Query items by primary key and optional sort key prefix
   */
  async query<T>(query: DbQuery): Promise<DbItem<T>[]> {
    const prefix = query.sk ? [query.pk, query.sk] : [query.pk];
    const iter = this.kv.list<T>(
      { prefix },
      {
        reverse: query.reversed,
        limit: query.limit,
      },
    );

    const items: DbItem<T>[] = [];
    for await (const entry of iter) {
      const [pk, sk] = entry.key as string[];
      items.push({
        pk,
        sk,
        data: entry.value,
        versionstamp: entry.versionstamp,
      });
    }

    return items;
  }

  /**
   * Stream items by primary key and optional sort key prefix
   */
  stream<T>(query: DbQuery): ReadableStream<DbItem<T>> {
    return new ReadableStream({
      start: async (controller) => {
        try {
          const prefix = query.sk ? [query.pk, query.sk] : [query.pk];
          const iter = this.kv.list<T>(
            { prefix },
            {
              reverse: query.reversed,
              limit: query.limit,
            },
          );

          for await (const entry of iter) {
            const [pk, sk] = entry.key as string[];
            controller.enqueue({
              pk,
              sk,
              data: entry.value,
              versionstamp: entry.versionstamp,
            });
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}
