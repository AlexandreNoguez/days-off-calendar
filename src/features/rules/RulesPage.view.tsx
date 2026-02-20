import { Box, Typography } from "@mui/material";

type Props = Record<string, never>;

export function RulesPageView(_props: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5">Regras</Typography>
      <Typography variant="body2">
        {_props ? JSON.stringify(_props) : "Sem props por enquanto."}
        Configure as regras (hard/soft) e parâmetros de coincidência/rodízio.
      </Typography>
    </Box>
  );
}
