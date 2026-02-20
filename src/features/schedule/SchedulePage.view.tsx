import { Box, Typography } from "@mui/material";

type Props = Record<string, never>;

export function SchedulePageView(_props: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5">Editor da escala</Typography>
      <Typography variant="body2">
        Aqui você vai montar as folgas e ver conflitos em tempo real.{" "}
        {_props ? JSON.stringify(_props) : "Sem props por enquanto."}
      </Typography>
    </Box>
  );
}
