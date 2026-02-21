import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";

type Props = {
  year: number;
  month: number;
  employeesCount: number;
  hardConflictsCount: number;
  softConflictsCount: number;
  canExport: boolean;
  onExport: () => void;
};

function padMonth(month: number): string {
  return String(month).padStart(2, "0");
}

export function ExportPageView(props: Props) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">Exportar</Typography>
        <Typography variant="body2" color="text.secondary">
          Gere a planilha da escala do período atual em formato Excel (.xlsx).
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Chip label={`Período: ${padMonth(props.month)}/${props.year}`} />
        <Chip label={`Colaboradores: ${props.employeesCount}`} />
        <Chip
          label={`Conflitos HARD: ${props.hardConflictsCount}`}
          color={props.hardConflictsCount > 0 ? "error" : "success"}
        />
        <Chip
          label={`Conflitos SOFT: ${props.softConflictsCount}`}
          color={props.softConflictsCount > 0 ? "warning" : "default"}
        />
      </Stack>

      {props.hardConflictsCount > 0 && (
        <Alert severity="warning">
          A exportação está disponível, mas existem conflitos HARD na escala.
        </Alert>
      )}

      {!props.canExport && (
        <Alert severity="info">
          Cadastre colaboradores e monte a escala para habilitar a exportação.
        </Alert>
      )}

      <Box>
        <Button variant="contained" onClick={props.onExport} disabled={!props.canExport}>
          Exportar XLSX
        </Button>
      </Box>
    </Stack>
  );
}
