import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

type Db = PrismaClient;

function createDb(): Db {
  const { env } = getCloudflareContext();
  const binding = (env as CloudflareEnv).DB;
  if (!binding) throw new Error("Cloudflare D1 binding DB is not configured");
  const adapter = new PrismaD1(binding);
  return new PrismaClient({ adapter });
}

// Keep the existing db.* call sites unchanged while creating the Prisma client
// from the request-scoped Cloudflare D1 binding.
export const db = new Proxy({} as Db, {
  get(_target, property) {
    const client = createDb();
    const value = (client as any)[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
