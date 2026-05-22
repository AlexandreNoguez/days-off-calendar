import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriAssessmentInput } from "../../contracts/assessments";
import { createNutriAssessment, listNutriAssessments } from "../../infra/assessmentRepository";
import { findNutriPatientById } from "../../infra/patientRepository";

export const runtime = "nodejs";

function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalDate(value: unknown): string | undefined {
  const text = optionalText(value);
  if (!text) return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value > 0 ? value : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAssessmentInput(body: NutriAssessmentInput | null): {
  assessment?: {
    patientId: string;
    date: string;
    objective?: string;
    weightKg?: number;
    heightCm?: number;
    waistCm?: number;
    hipCm?: number;
    activityLevel?: string;
    allergies: string[];
    intolerances: string[];
    dietaryRestrictions: string[];
    medications?: string;
    supplements?: string;
    foodRoutineNotes?: string;
    clinicalNotes?: string;
  };
  error?: string;
} {
  const patientId = optionalText(body?.patientId);
  const date = optionalDate(body?.date);

  if (!patientId) return { error: "Selecione um paciente." };
  if (!date) return { error: "Informe uma data valida para a avaliacao." };

  return {
    assessment: {
      patientId,
      date,
      objective: optionalText(body?.objective),
      weightKg: optionalNumber(body?.weightKg),
      heightCm: optionalNumber(body?.heightCm),
      waistCm: optionalNumber(body?.waistCm),
      hipCm: optionalNumber(body?.hipCm),
      activityLevel: optionalText(body?.activityLevel),
      allergies: stringArray(body?.allergies),
      intolerances: stringArray(body?.intolerances),
      dietaryRestrictions: stringArray(body?.dietaryRestrictions),
      medications: optionalText(body?.medications),
      supplements: optionalText(body?.supplements),
      foodRoutineNotes: optionalText(body?.foodRoutineNotes),
      clinicalNotes: optionalText(body?.clinicalNotes),
    },
  };
}

export async function GET(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const patientId = request.nextUrl.searchParams.get("patientId")?.trim() ?? "";
  if (!patientId) {
    return NextResponse.json({ error: "Selecione um paciente." }, { status: 400 });
  }

  const patient = await findNutriPatientById(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado." }, { status: 404 });
  }

  const assessments = await listNutriAssessments({ patientId });
  return NextResponse.json({ assessments });
}

export async function POST(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as NutriAssessmentInput | null;
  const parsed = parseAssessmentInput(body);

  if (!parsed.assessment) {
    return NextResponse.json(
      { error: parsed.error ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const patient = await findNutriPatientById(parsed.assessment.patientId);
  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado." }, { status: 404 });
  }

  const assessment = await createNutriAssessment({
    assessment: parsed.assessment,
    userId: user.id,
  });

  await writeAuditLog({
    user,
    action: "nutri.assessment.created",
    entityType: "nutriAssessment",
    entityId: assessment.id,
    metadata: {
      patientId: assessment.patientId,
      hasImc: Boolean(assessment.imc),
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ assessment }, { status: 201 });
}
