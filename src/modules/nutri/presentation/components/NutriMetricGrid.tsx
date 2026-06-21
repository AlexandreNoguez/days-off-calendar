"use client";

import { Box, Paper, Typography } from "@mui/material";

type NutriMetricItem = {
  description: string;
  label: string;
  value: string;
};

type NutriMetricGridProps = {
  items: NutriMetricItem[];
};

export function NutriMetricGrid({ items }: NutriMetricGridProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
          xl: "repeat(5, minmax(0, 1fr))",
        },
      }}
    >
      {items.map((item) => (
        <Paper
          key={item.label}
          variant="outlined"
          sx={{
            borderRadius: 2,
            p: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ my: 0.5 }}>
            {item.value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.description}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
