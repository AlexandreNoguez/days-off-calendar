"use client";

import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import { useLoginPage } from "./hooks/useLoginPage";

export function LoginPage() {
  const { state, actions } = useLoginPage();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Paper
        component="form"
        onSubmit={actions.submit}
        variant="outlined"
        sx={{ width: "100%", maxWidth: 420, p: 3 }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Escala de Folgas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Entre para acessar a escala e os cadastros.
            </Typography>
          </Box>

          {state.error && <Alert severity="error">{state.error}</Alert>}

          <TextField
            label="Usuario"
            value={state.username}
            onChange={(event) => actions.setUsername(event.target.value)}
            autoComplete="username"
            required
            fullWidth
          />

          <TextField
            label="Senha"
            type="password"
            value={state.password}
            onChange={(event) => actions.setPassword(event.target.value)}
            autoComplete="current-password"
            required
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            startIcon={<LoginIcon />}
            disabled={state.loading}
          >
            {state.loading ? "Entrando..." : "Entrar"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
