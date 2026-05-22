import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriPatientInput } from "../../contracts/patients";
import type { NutriPatientSex } from "../../domain/types";
import {
  createNutriPatient,
  listNutriPatients,
  summarizeNutriPatients,
} from "../../infra/patientRepository";

export const runtime = "nodejs";

const VALID_SEXES = new Set<NutriPatientSex>([
  "FEMALE",
  "MALE",
  "OTHER",
  "NOT_INFORMED",
]);

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

function parseSex(value: unknown): NutriPatientSex {
  return typeof value === "string" && VALID_SEXES.has(value as NutriPatientSex)
    ? (value as NutriPatientSex)
    : "NOT_INFORMED";
}

function parsePatientInput(body: NutriPatientInput | null): {
  patient?: {
    fullName: string;
    birthDate?: string;
    sex: NutriPatientSex;
    phone?: string;
    email?: string;
    notes?: string;
  };
  error?: string;
} {
  const fullName = optionalText(body?.fullName);

  if (!fullName) {
    return { error: "Informe o nome do paciente." };
  }

  return {
    patient: {
      fullName,
      birthDate: optionalDate(body?.birthDate),
      sex: parseSex(body?.sex),
      phone: optionalText(body?.phone),
      email: optionalText(body?.email),
      notes: optionalText(body?.notes),
    },
  };
}

export async function GET(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const [patients, summary] = await Promise.all([
    listNutriPatients({ query }),
    summarizeNutriPatients(),
  ]);

  return NextResponse.json({ patients, summary });
}

export async function POST(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as NutriPatientInput | null;
  const parsed = parsePatientInput(body);

  if (!parsed.patient) {
    return NextResponse.json(
      { error: parsed.error ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const patient = await createNutriPatient({
    patient: parsed.patient,
    userId: user.id,
  });

  await writeAuditLog({
    user,
    action: "nutri.patient.created",
    entityType: "nutriPatient",
    entityId: patient.id,
    metadata: { active: patient.active },
    ...requestMeta(request),
  });

  return NextResponse.json({ patient }, { status: 201 });
}
