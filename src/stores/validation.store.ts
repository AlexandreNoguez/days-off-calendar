import { create } from "zustand";
import type { ValidationResult } from "../domain/types/validation";

type ValidationState = {
  result: ValidationResult;

  actions: {
    setResult: (result: ValidationResult) => void;
    resetValidation: () => void;
  };
};

const empty: ValidationResult = {
  conflicts: [],
  isValid: true,
  statsPerEmployee: {},
};

export const useValidationStore = create<ValidationState>((set) => ({
  result: empty,

  actions: {
    setResult: (result) => set({ result }),
    resetValidation: () => set({ result: empty }),
  },
}));
