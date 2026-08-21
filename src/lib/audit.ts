import "server-only";
import { prisma } from "@/lib/db";

/** Records one audit-log entry. Never throws — a logging failure must not break
 * the mutation it's describing, so errors here are swallowed. */
export async function logAudit(entry: {
  storeId: string;
  userId: string | null;
  userName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        storeId: entry.storeId,
        userId: entry.userId,
        userName: entry.userName,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        summary: entry.summary,
      },
    });
  } catch {
    // Logging must never break the calling mutation.
  }
}
