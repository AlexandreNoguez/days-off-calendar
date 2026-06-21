"use client";

import type { ReactNode } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

type NutriSectionCardProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  title?: string;
};

export function NutriSectionCard({
  actions,
  children,
  description,
  title,
}: NutriSectionCardProps) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
      <Stack spacing={2}>
        {(title || description || actions) && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "flex-start" }}
          >
            <Box>
              {title && (
                <Typography variant="subtitle1" fontWeight={800}>
                  {title}
                </Typography>
              )}
              {description && (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>
            {actions}
          </Stack>
        )}
        {children}
      </Stack>
    </Paper>
  );
}
