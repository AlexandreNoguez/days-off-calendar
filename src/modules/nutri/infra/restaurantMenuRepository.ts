import { randomUUID } from "crypto";
import type { Collection, UpdateFilter } from "mongodb";
import { getDb } from "@/src/lib/server/mongodb";
import { calculateRestaurantMenuTotals } from "../application/calculateRestaurantMenuTotals";
import type {
  NutriRestaurantMenu,
  NutriRestaurantMenuRecipeItem,
  NutriRestaurantMenuStatus,
} from "../domain/types";

type NutriRestaurantMenuDocument = NutriRestaurantMenu & { _id?: unknown };

type SaveRestaurantMenuInput = {
  title: string;
  date: string;
  expectedMeals?: number;
  items: Array<Omit<NutriRestaurantMenuRecipeItem, "id">>;
};

let indexesPromise: Promise<void> | undefined;

function nowISO(): string {
  return new Date().toISOString();
}

function createRestaurantMenuId(): string {
  return `nutri_restaurant_menu_${randomUUID()}`;
}

function createRestaurantMenuItemId(): string {
  return `nutri_restaurant_menu_item_${randomUUID()}`;
}

function stripMongoId(document: NutriRestaurantMenuDocument): NutriRestaurantMenu {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...menu } = document;
  return menu;
}

async function getRestaurantMenusCollection(): Promise<
  Collection<NutriRestaurantMenuDocument>
> {
  const db = await getDb();
  return db.collection<NutriRestaurantMenuDocument>("nutriRestaurantMenus");
}

async function ensureNutriRestaurantMenuIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const collection = await getRestaurantMenusCollection();

      await collection.createIndexes([
        { key: { id: 1 }, name: "nutriRestaurantMenus_id_unique", unique: true },
        { key: { date: -1, status: 1 }, name: "nutriRestaurantMenus_date_status" },
        { key: { title: 1 }, name: "nutriRestaurantMenus_title" },
      ]);
    })();
  }

  try {
    await indexesPromise;
  } catch (error) {
    indexesPromise = undefined;
    throw error;
  }
}

function buildSearchRegex(query: string): RegExp | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;
  return new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function withItemIds(
  items: SaveRestaurantMenuInput["items"],
): NutriRestaurantMenuRecipeItem[] {
  return items.map((item) => ({
    ...item,
    id: createRestaurantMenuItemId(),
  }));
}

export async function listNutriRestaurantMenus(input: {
  query?: string;
} = {}): Promise<NutriRestaurantMenu[]> {
  await ensureNutriRestaurantMenuIndexes();
  const collection = await getRestaurantMenusCollection();
  const titleRegex = buildSearchRegex(input.query ?? "");

  const menus = await collection
    .find(titleRegex ? { title: titleRegex } : {})
    .sort({ date: -1, updatedAt: -1 })
    .toArray();

  return menus.map(stripMongoId);
}

export async function summarizeNutriRestaurantMenus(): Promise<{
  total: number;
  draft: number;
  approved: number;
  archived: number;
}> {
  await ensureNutriRestaurantMenuIndexes();
  const collection = await getRestaurantMenusCollection();

  const [total, draft, approved, archived] = await Promise.all([
    collection.countDocuments(),
    collection.countDocuments({ status: "DRAFT" }),
    collection.countDocuments({ status: "APPROVED" }),
    collection.countDocuments({ status: "ARCHIVED" }),
  ]);

  return { total, draft, approved, archived };
}

export async function createNutriRestaurantMenu(input: {
  menu: SaveRestaurantMenuInput;
  userId: string;
}): Promise<NutriRestaurantMenu> {
  await ensureNutriRestaurantMenuIndexes();
  const collection = await getRestaurantMenusCollection();
  const now = nowISO();
  const items = withItemIds(input.menu.items);
  const totals = calculateRestaurantMenuTotals({
    items,
    expectedMeals: input.menu.expectedMeals,
  });
  const menu: NutriRestaurantMenu = {
    id: createRestaurantMenuId(),
    title: input.menu.title,
    date: input.menu.date,
    status: "DRAFT",
    expectedMeals: input.menu.expectedMeals,
    items,
    totalCostCents: totals.totalCostCents,
    costPerCapitaCents: totals.costPerCapitaCents,
    totals: totals.totals,
    createdByUserId: input.userId,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(menu);
  return menu;
}

export async function updateNutriRestaurantMenuStatus(input: {
  id: string;
  status: NutriRestaurantMenuStatus;
  userId: string;
}): Promise<NutriRestaurantMenu | null> {
  await ensureNutriRestaurantMenuIndexes();
  const collection = await getRestaurantMenusCollection();
  const now = nowISO();
  const set: Partial<NutriRestaurantMenu> = {
    status: input.status,
    updatedAt: now,
  };
  const unset: Record<string, ""> = {};

  if (input.status === "APPROVED") {
    set.approvedAt = now;
    set.approvedByUserId = input.userId;
  }

  if (input.status === "DRAFT") {
    unset.approvedAt = "";
    unset.approvedByUserId = "";
  }

  const update: UpdateFilter<NutriRestaurantMenuDocument> = { $set: set };
  if (Object.keys(unset).length > 0) update.$unset = unset;

  const result = await collection.findOneAndUpdate(
    { id: input.id },
    update,
    { returnDocument: "after" },
  );

  return result ? stripMongoId(result) : null;
}
