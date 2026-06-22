import { cleanupE2EData, ensureE2EUsers, withDb } from "./support/db";
import { loadDotEnv } from "./support/env";

async function globalSetup() {
  loadDotEnv();
  await withDb(async (db) => {
    await ensureE2EUsers(db);
    await cleanupE2EData(db);
  });
}

export default globalSetup;
