import { MongoClient, type Db } from "mongodb";
import { getOptionalEnv, getRequiredEnv } from "./env";

declare global {
  var escalaFolgaMongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalThis.escalaFolgaMongoClientPromise) {
    const uri = getRequiredEnv("MONGODB_URI");
    const client = new MongoClient(uri);
    globalThis.escalaFolgaMongoClientPromise = client.connect();
  }

  return globalThis.escalaFolgaMongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(getOptionalEnv("MONGODB_DB_NAME", "escala_folga"));
}
