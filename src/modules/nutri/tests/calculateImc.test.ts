import { describe, expect, it } from "vitest";
import { calculateImc } from "../application/calculateImc";

describe("calculateImc", () => {
  it("returns undefined when weight or height is missing", () => {
    expect(calculateImc({ weightKg: 70 })).toBeUndefined();
    expect(calculateImc({ heightCm: 170 })).toBeUndefined();
  });

  it("calculates imc rounded to one decimal place", () => {
    expect(calculateImc({ weightKg: 70, heightCm: 170 })).toEqual({
      value: 24.2,
      classification: "NORMAL",
    });
  });

  it("classifies obesity levels", () => {
    expect(calculateImc({ weightKg: 98, heightCm: 170 })?.classification).toBe(
      "OBESITY_I",
    );
    expect(calculateImc({ weightKg: 118, heightCm: 170 })?.classification).toBe(
      "OBESITY_III",
    );
  });
});
