import { Box, Typography } from "@mui/material";

type Props = Record<string, never>;

export function EmployeesPageView(_props: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5">Cadastro de pessoas</Typography>
      <Typography variant="body2">
        {_props ? JSON.stringify(_props) : "Sem props por enquanto."}
        Cadastre colaboradores, cargos e marque quem sempre folga aos domingos.
      </Typography>
    </Box>
  );
}
