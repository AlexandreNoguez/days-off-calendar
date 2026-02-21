import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { type WizardStep, useAppStore } from "../../stores/app.store";

const steps: WizardStep[] = ["setup", "schedule", "export"];

export function useWizardFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { wizardStep, actions } = useAppStore();

  const currentStep = useMemo(() => {
    const match = steps.find((s) => location.pathname.includes(`/wizard/${s}`));
    return match ?? (steps.includes(wizardStep) ? wizardStep : "setup");
  }, [location.pathname, wizardStep]);

  const currentIndex = steps.indexOf(currentStep);

  function goTo(step: WizardStep) {
    actions.setWizardStep(step);
    navigate(`/wizard/${step}`);
  }

  function goNext() {
    const next = steps[Math.min(currentIndex + 1, steps.length - 1)];
    goTo(next);
  }

  function goBack() {
    const prev = steps[Math.max(currentIndex - 1, 0)];
    goTo(prev);
  }

  return {
    state: { steps, currentStep, currentIndex },
    actions: { goTo, goNext, goBack },
  };
}
