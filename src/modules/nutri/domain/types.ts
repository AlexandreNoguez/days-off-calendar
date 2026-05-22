export type NutriPatientSex = "FEMALE" | "MALE" | "OTHER" | "NOT_INFORMED";

export type NutriPatient = {
  id: string;
  fullName: string;
  birthDate?: string;
  sex: NutriPatientSex;
  phone?: string;
  email?: string;
  notes?: string;
  active: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type NutriImcClassification =
  | "UNDERWEIGHT"
  | "NORMAL"
  | "OVERWEIGHT"
  | "OBESITY_I"
  | "OBESITY_II"
  | "OBESITY_III";

export type NutriImcResult = {
  value: number;
  classification: NutriImcClassification;
};

export type NutriAssessment = {
  id: string;
  patientId: string;
  date: string;
  objective?: string;
  weightKg?: number;
  heightCm?: number;
  imc?: NutriImcResult;
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
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};
