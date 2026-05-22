import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriPatientInput } from "../../contracts/patients";
import type { NutriPatientSex } from "../../domain/types";
import { updateNutriPatient } from "../../infra/patientRepository";

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

function parsePatch(body: NutriPatientInput | null) {
  const patch: NutriPatientInput = {};

  if (typeof body?.fullName === "string") {
    const fullName = optionalText(body.fullName);
    if (!fullName) return { error: "Informe o nome do paciente." };
    patch.fullName = fullName;
  }

  if (typeof body?.birthDate === "string") {
    patch.birthDate = optionalDate(body.birthDate);
  }

  if (typeof body?.sex === "string" && VALID_SEXES.has(body.sex as NutriPatientSex)) {
    patch.sex = body.sex as NutriPatientSex;
  }

  if (typeof body?.phone === "string") patch.phone = optionalText(body.phone);
  if (typeof body?.email === "string") patch.email = optionalText(body.email);
  if (typeof body?.notes === "string") patch.notes = optionalText(body.notes);
  if (typeof body?.active === "boolean") patch.active = body.active;

  return { patch };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as NutriPatientInput | null;
  const parsed = parsePatch(body);

  if (!parsed.patch) {
    return NextResponse.json(
      { error: parsed.error ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const patient = await updateNutriPatient({ id, patch: parsed.patch });
  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.patient.updated",
    entityType: "nutriPatient",
    entityId: patient.id,
    metadata: {
      changedFields: Object.keys(parsed.patch),
      active: patient.active,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ patient });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await context.params;
  const patient = await updateNutriPatient({ id, patch: { active: false } });
  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado." }, { status: 404 });
  }

  await writeAuditLog({
    user,
    action: "nutri.patient.archived",
    entityType: "nutriPatient",
    entityId: patient.id,
    metadata: { active: patient.active },
    ...requestMeta(request),
  });

  return NextResponse.json({ patient });
}
