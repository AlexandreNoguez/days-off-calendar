"use client";

import { CircularProgress, Stack, Typography } from "@mui/material";

type NutriLoadingStateProps = {
  message: string;
};

export function NutriLoadingState({ message }: NutriLoadingStateProps) {
  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
      <CircularProgress />
      <Typography color="text.secondary">{message}</Typography>
    </Stack>
  );
}
