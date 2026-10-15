import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

// Created on first use rather than at import: `next build` imports this module
// to collect page data, and some hosts (Plesk's "Run Node.js commands") don't
// pass the app's env vars to that step. The mariadb pool also starts connecting
// as soon as it's created, which would stall the build.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = (global.__prisma ??= createPrisma());
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
