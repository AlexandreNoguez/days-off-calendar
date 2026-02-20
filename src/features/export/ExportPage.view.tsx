import { Box, Button, Typography } from "@mui/material";

type Props = Record<string, never>;

export function ExportPageView(_props: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5">Exportar</Typography>
      <Typography variant="body2">
        Aqui você vai gerar o XLSX do mês planejado.{" "}
        {_props ? JSON.stringify(_props) : "Sem props por enquanto."}
      </Typography>
      <Button variant="contained" disabled>
        Exportar XLSX (em breve)
      </Button>
    </Box>
  );
}
