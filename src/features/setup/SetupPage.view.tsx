import type { DateISO } from "../../domain/types/ids";
import type { SetupCalendarCell } from "./useSetup";

import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

type Option = { value: number; label: string };

type Props = {
  year: number;
  month: number;

  monthOptions: Option[];
  yearOptions: number[];
  weekdayLabels: readonly string[];

  calendarCells: SetupCalendarCell[];
  holidaysCount: number;

  onChangeYear: (year: number) => void;
  onChangeMonth: (month: number) => void;
  onToggleHoliday: (dateISO: DateISO) => void;
  onClearHolidays: () => void;
};

export function SetupPageView(props: Props) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">Setup</Typography>
        <Typography variant="body2" color="text.secondary">
          Selecione o mês/ano e marque os feriados do período.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="month-label">Mês</InputLabel>
            <Select
              labelId="month-label"
              label="Mês"
              value={props.month}
              onChange={(e) => props.onChangeMonth(Number(e.target.value))}
            >
              {props.monthOptions.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="year-label">Ano</InputLabel>
            <Select
              labelId="year-label"
              label="Ano"
              value={props.year}
              onChange={(e) => props.onChangeYear(Number(e.target.value))}
            >
              {props.yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`Feriados marcados: ${props.holidaysCount}`} />
            <Button
              variant="outlined"
              onClick={props.onClearHolidays}
              disabled={props.holidaysCount === 0}
            >
              Limpar feriados
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Weekday header */}
      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}
      >
        {props.weekdayLabels.map((w) => (
          <Box key={w} sx={{ px: 1, py: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {w}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}
      >
        {props.calendarCells.map((cell) => {
          if (cell.kind === "blank") {
            return <Box key={cell.key} sx={{ minHeight: 64 }} />;
          }

          return (
            <Card
              key={cell.key}
              variant="outlined"
              sx={{
                minHeight: 64,
                borderColor: cell.isHoliday ? "primary.main" : undefined,
              }}
            >
              <CardActionArea
                sx={{
                  height: "100%",
                  p: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.5,
                }}
                onClick={() => props.onToggleHoliday(cell.dateISO)}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2">{cell.day}</Typography>
                  {cell.isSunday && <Chip size="small" label="Dom" />}
                  {cell.isHoliday && (
                    <Chip size="small" color="primary" label="Feriado" />
                  )}
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  {cell.weekdayLabel}
                </Typography>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Stack>
  );
}
