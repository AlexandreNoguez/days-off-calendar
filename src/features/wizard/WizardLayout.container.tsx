import { Outlet } from "react-router-dom";
import { useWizardFlow } from "./useWizardFlow";
import { WizardLayoutView } from "./WizardLayout.view";

export function WizardLayoutContainer() {
  const wizard = useWizardFlow();

  return (
    <WizardLayoutView
      steps={wizard.state.steps}
      currentStep={wizard.state.currentStep}
      currentIndex={wizard.state.currentIndex}
      onGoTo={wizard.actions.goTo}
      onNext={wizard.actions.goNext}
      onBack={wizard.actions.goBack}
      content={<Outlet />}
    />
  );
}
