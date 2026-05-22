import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { PublicUser, UserDocument, UserRole } from "../types";
import { getOptionalEnv, getRequiredEnv } from "./env";
import { ensureDatabaseIndexes, getDb } from "./mongodb";
import { hashPassword, verifyPassword } from "./passwords";

export const SESSION_COOKIE = "escala_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  userId: string;
  username: string;
  role: UserRole;
  exp: number;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(input: string): string {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", getRequiredEnv("SESSION_SECRET"))
    .update(value)
    .digest("base64url");
}

function publicUser(user: UserDocument): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function getInitialAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (password) return password;

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD is required to create the initial admin user in production.");
  }

  return "admin123";
}

export function createSessionToken(user: PublicUser): string {
  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getUserBySessionToken(
  token?: string,
): Promise<PublicUser | null> {
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const db = await getDb();
  const user = await db
    .collection<UserDocument>("users")
    .findOne({ id: payload.userId, active: true });

  return user ? publicUser(user) : null;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserBySessionToken(token);
}

export async function requireCurrentUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdminUser(): Promise<PublicUser> {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function requireNutriUser(): Promise<PublicUser> {
  const user = await requireCurrentUser();
  if (user.role !== "NUTRI") throw new Error("Forbidden");
  return user;
}

export function setSessionCookie(response: NextResponse, user: PublicUser): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function ensureAdminUser(): Promise<void> {
  await ensureDatabaseIndexes();

  const db = await getDb();
  const users = db.collection<UserDocument>("users");

  const username = getOptionalEnv("ADMIN_USERNAME", "admin").trim();
  const displayName = getOptionalEnv("ADMIN_DISPLAY_NAME", "Administrador").trim();

  const existingAdmin = await users.findOne({ username });
  if (existingAdmin) return;

  const password = getInitialAdminPassword();
  const now = new Date().toISOString();
  await users.insertOne({
    id: randomUUID(),
    username,
    displayName,
    passwordHash: await hashPassword(password),
    role: "ADMIN",
    active: true,
    createdAt: now,
    updatedAt: now,
  });
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<PublicUser | null> {
  await ensureAdminUser();

  const db = await getDb();
  const user = await db.collection<UserDocument>("users").findOne({ username });
  if (!user || !user.active) return null;

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) return null;

  const now = new Date().toISOString();
  await db
    .collection<UserDocument>("users")
    .updateOne({ id: user.id }, { $set: { lastLoginAt: now, updatedAt: now } });

  return publicUser({ ...user, lastLoginAt: now, updatedAt: now });
}

export function requestMeta(request: NextRequest): {
  ip?: string;
  userAgent?: string;
} {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return {
    ip: forwardedFor?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}
