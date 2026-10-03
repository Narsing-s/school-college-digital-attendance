import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

type Db = PrismaClient;

function createDb(): Db {
  const { env } = getCloudflareContext();
  const binding = (env as CloudflareEnv).DB;
  if (!binding) throw new Error("Cloudflare D1 binding DB is not configured");
  return new PrismaClient({ adapter: new PrismaD1(binding) });
}

/**
 * D1 does not provide ACID transactions. Keep the existing Prisma call sites
 * working by executing transaction callbacks against the same request-scoped
 * client. Array transactions are awaited together. Callers must therefore
 * treat multi-write operations as idempotent and must not depend on rollback.
 */
export const db = new Proxy({} as Db, {
  get(_target, property) {
    const client = createDb();
    if (property === "$transaction") {
      return async (input: unknown) => {
        if (Array.isArray(input)) return Promise.all(input);
        if (typeof input === "function") return input(client);
        throw new Error("Unsupported transaction input");
      };
    }
    const value = (client as any)[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
