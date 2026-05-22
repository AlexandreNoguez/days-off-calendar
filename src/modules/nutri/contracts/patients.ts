import type { NutriPatient, NutriPatientSex } from "../domain/types";

export type NutriPatientInput = {
  fullName?: string;
  birthDate?: string;
  sex?: NutriPatientSex;
  phone?: string;
  email?: string;
  notes?: string;
  active?: boolean;
};

export type NutriPatientsResponse = {
  patients: NutriPatient[];
  summary: {
    total: number;
    active: number;
    archived: number;
  };
};

export type NutriPatientResponse = {
  patient: NutriPatient;
};
