import {
  DbInterface,
  DbItem,
  DbItemKey,
  DbQuery,
  TransactionError,
  BaseDatabase,
} from "./types.ts";

/**
 * Deno KV implementation of the database interface
 * Uses native Deno.KV for storage with built-in atomic operations
 */
export class DenoKVDatabase extends BaseDatabase {
  private kv: Deno.Kv;

  constructor(kv: Deno.Kv) {
    super();
    this.kv = kv;
  }

  /**
   * Create a KV key from primary key and sort key components
   */
  private createKey(key: DbItemKey): Deno.KvKey {
    return [key.pk, key.sk];
  }

  /**
   * Get multiple items by their keys
   */
  async get<T>(keys: DbItemKey[]): Promise<DbItem<T>[]> {
    const results: DbItem<T>[] = [];

    // Batch get all items
    const kvKeys = keys.map((key) => this.createKey(key));

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
    console.log("Setting items:", items);
    const itemArray = Array.isArray(items) ? items : [items];
    if (itemArray.length === 0) return;

    let atomic = this.kv.atomic();

    for (const item of itemArray) {
      const key = this.createKey(item);
      
      // If item has a versionstamp, check it
      if (item.versionstamp !== undefined) {
        atomic = atomic.check({ key, versionstamp: item.versionstamp });
      } 

      // Set the item with TTL if specified
      atomic = atomic.set(key, item.data, item.ttl ? { expireIn: item.ttl } : {});
     }

    try {
      const result = await atomic.commit();
      if (!result.ok) {
         throw new TransactionError();
      }
    } catch (error) {
      console.error(error);
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
    
    const selector: Deno.KvListSelector = query.sk 
      ? {
          prefix: [query.pk],
          start: [query.pk, query.sk]
        }
      : { prefix: [query.pk] };

    const iter = this.kv.list<T>(
      selector,
      {
        reverse: query.reverse,
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
          const selector: Deno.KvListSelector = query.sk 
            ? {
                prefix: [query.pk],
                ...(query.reverse 
                  ? { end: [query.pk, query.sk] }
                  : { start: [query.pk, query.sk] })
              }
            : { prefix: [query.pk] };

          const iter = this.kv.list<T>(
            selector,
            {
              reverse: query.reverse,
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
