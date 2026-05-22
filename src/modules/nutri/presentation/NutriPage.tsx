"use client";

import {
  Alert,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { useNutriPage } from "./hooks/useNutriPage";

export function NutriPage() {
  const { state } = useNutriPage();

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <RestaurantMenuIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Modulo Nutri
          </Typography>
          <Chip size="small" label="NUTRI" color="success" />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Area dedicada a pacientes, planos alimentares, receitas, fichas tecnicas
          e cardapios.
        </Typography>
      </Box>

      <Alert severity="info">
        Esta primeira versao cria a fronteira do modulo. As proximas entregas
        entram por aqui, mantendo dominio, telas e casos de uso dentro de
        src/modules/nutri.
      </Alert>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {state.summary.map((item) => (
          <Paper key={item.label} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>
              {item.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.description}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Proximos passos do modulo
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <List dense disablePadding>
          {state.firstSteps.map((step, index) => (
            <ListItem key={step} disableGutters>
              <ListItemText
                primary={`${index + 1}. ${step}`}
                primaryTypographyProps={{ variant: "body2" }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}
