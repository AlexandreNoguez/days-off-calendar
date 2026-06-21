import { Box, Typography } from "@mui/material";

export function AdminPageHeader() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700}>
        Administrador
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Gerencie usuarios e acompanhe logins e acoes realizadas no sistema.
      </Typography>
    </Box>
  );
}
