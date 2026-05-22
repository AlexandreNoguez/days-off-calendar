import type { NutriImcClassification, NutriImcResult } from "../domain/types";

function classifyImc(value: number): NutriImcClassification {
  if (value < 18.5) return "UNDERWEIGHT";
  if (value < 25) return "NORMAL";
  if (value < 30) return "OVERWEIGHT";
  if (value < 35) return "OBESITY_I";
  if (value < 40) return "OBESITY_II";
  return "OBESITY_III";
}

export function calculateImc(input: {
  weightKg?: number;
  heightCm?: number;
}): NutriImcResult | undefined {
  if (!input.weightKg || !input.heightCm) return undefined;
  if (input.weightKg <= 0 || input.heightCm <= 0) return undefined;

  const heightM = input.heightCm / 100;
  const rawValue = input.weightKg / (heightM * heightM);
  const value = Math.round(rawValue * 10) / 10;

  return {
    value,
    classification: classifyImc(value),
  };
}
