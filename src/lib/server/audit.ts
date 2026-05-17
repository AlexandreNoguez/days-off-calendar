import { randomUUID } from "crypto";
import type { AuditLog, PublicUser } from "../types";
import { getDb } from "./mongodb";

type AuditInput = {
  user?: Pick<PublicUser, "id" | "username">;
  usernameSnapshot?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const log: AuditLog = {
    id: randomUUID(),
    userId: input.user?.id,
    usernameSnapshot: input.user?.username ?? input.usernameSnapshot,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
    ip: input.ip,
    userAgent: input.userAgent,
    createdAt: now,
  };

  await db.collection<AuditLog>("auditLogs").insertOne(log);
}
