import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS, clearAllPersistedData } from "./persistence";

export type WizardStep = "setup" | "schedule" | "export";

type AppState = {
  schemaVersion: number;
  wizardStep: WizardStep;
  hasSavedData: boolean;

  actions: {
    setWizardStep: (step: WizardStep) => void;
    setHasSavedData: (value: boolean) => void;
    clearLocalStorageOnly: () => void;
  };
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      schemaVersion: 1,
      wizardStep: "setup",
      hasSavedData: false,

      actions: {
        // Idempotent updates (avoid loops / extra rerenders)
        setWizardStep: (wizardStep) =>
          set((s) => (s.wizardStep === wizardStep ? s : { wizardStep })),

        setHasSavedData: (hasSavedData) =>
          set((s) => (s.hasSavedData === hasSavedData ? s : { hasSavedData })),

        clearLocalStorageOnly: () => {
          clearAllPersistedData();
          set({ hasSavedData: false, wizardStep: "setup" });
        },
      },
    }),
    {
      name: STORAGE_KEYS.app,

      // ✅ Persist only serializable fields (never persist actions)
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        wizardStep: state.wizardStep,
        hasSavedData: state.hasSavedData,
      }),
    },
  ),
);
