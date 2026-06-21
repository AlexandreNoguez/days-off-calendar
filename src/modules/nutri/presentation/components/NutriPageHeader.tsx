"use client";

import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type NutriPageHeaderProps = {
  badgeLabel: string;
  description: string;
  title: string;
};

export function NutriPageHeader({
  badgeLabel,
  description,
  title,
}: NutriPageHeaderProps) {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        borderRadius: 2,
        overflow: "hidden",
        p: { xs: 2, md: 3 },
        backgroundImage: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.1,
        )}, ${alpha(theme.palette.success.main, 0.08)})`,
      })}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={(theme) => ({
            alignItems: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            borderRadius: 2,
            color: "primary.main",
            display: "flex",
            height: 48,
            justifyContent: "center",
            width: 48,
          })}
        >
          <RestaurantMenuIcon />
        </Box>
        <Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography variant="h5" fontWeight={800}>
              {title}
            </Typography>
            <Chip size="small" label={badgeLabel} color="success" />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {description}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
