import { MongoClient } from "mongodb";
import { randomBytes, randomUUID, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

const uri = requiredEnv("MONGODB_URI");
const dbName = process.env.MONGODB_DB_NAME || "escala_folga";
const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "admin123";
const displayName = process.env.ADMIN_DISPLAY_NAME || "Administrador";

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");
  const existing = await users.findOne({ username });

  if (existing) {
    console.log(`Admin user "${username}" already exists.`);
    process.exit(0);
  }

  const now = new Date().toISOString();
  await users.insertOne({
    id: `user_${randomUUID()}`,
    username,
    displayName,
    passwordHash: await hashPassword(password),
    role: "ADMIN",
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Admin user "${username}" created.`);
} finally {
  await client.close();
}
