import { randomUUID } from "crypto";
import type { Collection, UpdateFilter } from "mongodb";
import { getDb } from "@/src/lib/server/mongodb";
import type { NutriPatient, NutriPatientSex } from "../domain/types";

type NutriPatientDocument = NutriPatient & { _id?: unknown };

type SavePatientInput = {
  fullName: string;
  birthDate?: string;
  sex: NutriPatientSex;
  phone?: string;
  email?: string;
  notes?: string;
  active?: boolean;
};

type UpdatePatientInput = Partial<SavePatientInput>;

let indexesPromise: Promise<void> | undefined;

function nowISO(): string {
  return new Date().toISOString();
}

function createPatientId(): string {
  return `nutri_patient_${randomUUID()}`;
}

function stripMongoId(document: NutriPatientDocument): NutriPatient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...patient } = document;
  return patient;
}

async function getPatientsCollection(): Promise<Collection<NutriPatientDocument>> {
  const db = await getDb();
  return db.collection<NutriPatientDocument>("nutriPatients");
}

async function ensureNutriPatientIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const collection = await getPatientsCollection();

      await collection.createIndexes([
        { key: { id: 1 }, name: "nutriPatients_id_unique", unique: true },
        { key: { fullName: 1 }, name: "nutriPatients_fullName" },
        { key: { active: 1, updatedAt: -1 }, name: "nutriPatients_active_updatedAt" },
        { key: { createdByUserId: 1, updatedAt: -1 }, name: "nutriPatients_user_updatedAt" },
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

export async function listNutriPatients(input: {
  query?: string;
} = {}): Promise<NutriPatient[]> {
  await ensureNutriPatientIndexes();
  const collection = await getPatientsCollection();
  const nameRegex = buildSearchRegex(input.query ?? "");

  const patients = await collection
    .find(nameRegex ? { fullName: nameRegex } : {})
    .sort({ active: -1, fullName: 1 })
    .toArray();

  return patients.map(stripMongoId);
}

export async function summarizeNutriPatients(): Promise<{
  total: number;
  active: number;
  archived: number;
}> {
  await ensureNutriPatientIndexes();
  const collection = await getPatientsCollection();

  const [total, active] = await Promise.all([
    collection.countDocuments(),
    collection.countDocuments({ active: true }),
  ]);

  return {
    total,
    active,
    archived: total - active,
  };
}

export async function findNutriPatientById(id: string): Promise<NutriPatient | null> {
  await ensureNutriPatientIndexes();
  const collection = await getPatientsCollection();
  const patient = await collection.findOne({ id });
  return patient ? stripMongoId(patient) : null;
}

export async function createNutriPatient(input: {
  patient: SavePatientInput;
  userId: string;
}): Promise<NutriPatient> {
  await ensureNutriPatientIndexes();
  const collection = await getPatientsCollection();
  const now = nowISO();

  const patient: NutriPatient = {
    id: createPatientId(),
    fullName: input.patient.fullName,
    birthDate: input.patient.birthDate,
    sex: input.patient.sex,
    phone: input.patient.phone,
    email: input.patient.email,
    notes: input.patient.notes,
    active: input.patient.active ?? true,
    createdByUserId: input.userId,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(patient);
  return patient;
}

export async function updateNutriPatient(input: {
  id: string;
  patch: UpdatePatientInput;
}): Promise<NutriPatient | null> {
  await ensureNutriPatientIndexes();
  const collection = await getPatientsCollection();
  const set: Partial<NutriPatient> = { updatedAt: nowISO() };
  const unset: Record<string, ""> = {};

  for (const [key, value] of Object.entries(input.patch)) {
    if (typeof value === "undefined") {
      unset[key] = "";
    } else {
      set[key as keyof NutriPatient] = value as never;
    }
  }

  const update: UpdateFilter<NutriPatientDocument> = {
    $set: set,
  };

  if (Object.keys(unset).length > 0) {
    update.$unset = unset;
  }

  const result = await collection.findOneAndUpdate(
    { id: input.id },
    update,
    { returnDocument: "after" },
  );

  return result ? stripMongoId(result) : null;
}
