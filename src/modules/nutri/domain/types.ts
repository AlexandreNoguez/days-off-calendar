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
