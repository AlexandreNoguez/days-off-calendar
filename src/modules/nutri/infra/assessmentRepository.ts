import { randomUUID } from "crypto";
import type { Collection, UpdateFilter } from "mongodb";
import { getDb } from "@/src/lib/server/mongodb";
import { calculateImc } from "../application/calculateImc";
import type { NutriAssessment } from "../domain/types";

type NutriAssessmentDocument = NutriAssessment & { _id?: unknown };

type SaveAssessmentInput = {
  patientId: string;
  date: string;
  objective?: string;
  weightKg?: number;
  heightCm?: number;
  waistCm?: number;
  hipCm?: number;
  activityLevel?: string;
  allergies?: string[];
  intolerances?: string[];
  dietaryRestrictions?: string[];
  medications?: string;
  supplements?: string;
  foodRoutineNotes?: string;
  clinicalNotes?: string;
};

let indexesPromise: Promise<void> | undefined;

function nowISO(): string {
  return new Date().toISOString();
}

function createAssessmentId(): string {
  return `nutri_assessment_${randomUUID()}`;
}

function stripMongoId(document: NutriAssessmentDocument): NutriAssessment {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...assessment } = document;
  return assessment;
}

async function getAssessmentsCollection(): Promise<Collection<NutriAssessmentDocument>> {
  const db = await getDb();
  return db.collection<NutriAssessmentDocument>("nutriAssessments");
}

async function ensureNutriAssessmentIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const collection = await getAssessmentsCollection();

      await collection.createIndexes([
        { key: { id: 1 }, name: "nutriAssessments_id_unique", unique: true },
        { key: { patientId: 1, date: -1 }, name: "nutriAssessments_patient_date" },
        { key: { createdByUserId: 1, date: -1 }, name: "nutriAssessments_user_date" },
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

function withDerivedFields(input: SaveAssessmentInput): SaveAssessmentInput & {
  imc?: NutriAssessment["imc"];
} {
  return {
    ...input,
    imc: calculateImc({
      weightKg: input.weightKg,
      heightCm: input.heightCm,
    }),
  };
}

export async function listNutriAssessments(input: {
  patientId: string;
}): Promise<NutriAssessment[]> {
  await ensureNutriAssessmentIndexes();
  const collection = await getAssessmentsCollection();

  const assessments = await collection
    .find({ patientId: input.patientId })
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  return assessments.map(stripMongoId);
}

export async function createNutriAssessment(input: {
  assessment: SaveAssessmentInput;
  userId: string;
}): Promise<NutriAssessment> {
  await ensureNutriAssessmentIndexes();
  const collection = await getAssessmentsCollection();
  const now = nowISO();
  const assessmentInput = withDerivedFields(input.assessment);

  const assessment: NutriAssessment = {
    id: createAssessmentId(),
    patientId: assessmentInput.patientId,
    date: assessmentInput.date,
    objective: assessmentInput.objective,
    weightKg: assessmentInput.weightKg,
    heightCm: assessmentInput.heightCm,
    imc: assessmentInput.imc,
    waistCm: assessmentInput.waistCm,
    hipCm: assessmentInput.hipCm,
    activityLevel: assessmentInput.activityLevel,
    allergies: assessmentInput.allergies ?? [],
    intolerances: assessmentInput.intolerances ?? [],
    dietaryRestrictions: assessmentInput.dietaryRestrictions ?? [],
    medications: assessmentInput.medications,
    supplements: assessmentInput.supplements,
    foodRoutineNotes: assessmentInput.foodRoutineNotes,
    clinicalNotes: assessmentInput.clinicalNotes,
    createdByUserId: input.userId,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(assessment);
  return assessment;
}

export async function updateNutriAssessment(input: {
  id: string;
  patch: Partial<SaveAssessmentInput>;
}): Promise<NutriAssessment | null> {
  await ensureNutriAssessmentIndexes();
  const collection = await getAssessmentsCollection();
  const existing = await collection.findOne({ id: input.id });
  if (!existing) return null;

  const nextInput = withDerivedFields({
    patientId: existing.patientId,
    date: existing.date,
    objective: existing.objective,
    weightKg: existing.weightKg,
    heightCm: existing.heightCm,
    waistCm: existing.waistCm,
    hipCm: existing.hipCm,
    activityLevel: existing.activityLevel,
    allergies: existing.allergies,
    intolerances: existing.intolerances,
    dietaryRestrictions: existing.dietaryRestrictions,
    medications: existing.medications,
    supplements: existing.supplements,
    foodRoutineNotes: existing.foodRoutineNotes,
    clinicalNotes: existing.clinicalNotes,
    ...input.patch,
  });

  const update: UpdateFilter<NutriAssessmentDocument> = {
    $set: {
      ...nextInput,
      updatedAt: nowISO(),
    },
  };

  const result = await collection.findOneAndUpdate(
    { id: input.id },
    update,
    { returnDocument: "after" },
  );

  return result ? stripMongoId(result) : null;
}
