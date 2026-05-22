import type { NutriAssessment } from "../domain/types";

export type NutriAssessmentInput = {
  patientId?: string;
  date?: string;
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

export type NutriAssessmentsResponse = {
  assessments: NutriAssessment[];
};

export type NutriAssessmentResponse = {
  assessment: NutriAssessment;
};
