import React from "react";
import { Box, Button, Step, StepLabel, Stepper } from "@mui/material";
import type { WizardStep } from "../../stores/app.store";

type Props = {
  steps: WizardStep[];
  currentStep: WizardStep;
  currentIndex: number;
  onGoTo: (step: WizardStep) => void;
  onNext: () => void;
  onBack: () => void;
  content: React.ReactNode;
};

export function WizardLayoutView(props: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Stepper activeStep={props.currentIndex} alternativeLabel>
        {props.steps.map((s) => (
          <Step key={s} onClick={() => props.onGoTo(s)}>
            <StepLabel>{s}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box>{props.content}</Box>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={props.onBack} disabled={props.currentIndex === 0}>
          Back
        </Button>
        <Button
          onClick={props.onNext}
          disabled={props.currentIndex === props.steps.length - 1}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
