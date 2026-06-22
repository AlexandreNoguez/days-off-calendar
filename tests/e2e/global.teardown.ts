import { cleanupE2EData, withDb } from "./support/db";

async function globalTeardown() {
  await withDb(cleanupE2EData);
}

export default globalTeardown;
