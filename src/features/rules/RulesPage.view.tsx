import type { Employee, Role } from "../../domain/types/employees";
import type { RuleId } from "../../domain/types/ids";
import type { RuleConfig } from "../../domain/types/rules";
import type { RuleFieldSpec, RuleFormSchema } from "./ruleFormRegistry";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

type EditState = {
  text: string;
  error?: string;
};

type FormEditState = {
  params: Record<string, unknown>;
};

type Props = {
  rules: RuleConfig[];
  hasRules: boolean;
  editing: Record<RuleId, EditState>;
  formEditing: Record<RuleId, FormEditState>;
  formReadyRulesCount: number;
  formRegistry: Partial<Record<RuleConfig["key"], RuleFormSchema>>;
  roles: Role[];
  employees: Employee[];

  onEnsureDefaultRules: () => void;
  onResetToDefaults: () => void;
  onRestoreRulesDefaults: () => void;

  onToggleRule: (ruleId: RuleId, enabled: boolean) => void;
  onStartEditParams: (ruleId: RuleId) => void;
  onCancelEditParams: (ruleId: RuleId) => void;
  onChangeParamsDraft: (ruleId: RuleId, text: string) => void;
  onSaveParams: (ruleId: RuleId) => void;

  onStartFormEdit: (ruleId: RuleId) => void;
  onCancelFormEdit: (ruleId: RuleId) => void;
  onUpdateFormField: (ruleId: RuleId, field: string, value: unknown) => void;
  onSaveFormEdit: (ruleId: RuleId) => void;
};

type Option = {
  value: string;
  label: string;
};

function severityColor(severity: RuleConfig["severity"]): "error" | "warning" {
  return severity === "HARD" ? "error" : "warning";
}

function getSourceOptions(
  field: RuleFieldSpec,
  employees: Employee[],
  roles: Role[],
): Option[] {
  if (field.type !== "select" && field.type !== "multiselect") return [];

  if (field.source === "employees") {
    return employees.map((employee) => ({ value: employee.id, label: employee.name }));
  }

  return roles.map((role) => ({ value: role.id, label: role.name }));
}

export function RulesPageView(props: Props) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">Regras</Typography>
        <Typography variant="body2" color="text.secondary">
          Friendly forms are default and JSON stays available as an optional advanced mode.
        </Typography>
      </Box>

      <Alert severity="info">
        Friendly form registry is ready for {props.formReadyRulesCount} rules in this first step.
      </Alert>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button variant="contained" onClick={props.onEnsureDefaultRules}>
          Carregar regras padrão
        </Button>
        <Button variant="outlined" onClick={props.onResetToDefaults}>
          Restaurar defaults
        </Button>
        <Button variant="outlined" color="secondary" onClick={props.onRestoreRulesDefaults}>
          Restaurar defaults (seed)
        </Button>
      </Stack>

      {!props.hasRules && (
        <Alert severity="info">
          Ainda não há regras cadastradas. Clique em "Carregar regras padrão".
        </Alert>
      )}

      {props.rules.map((rule) => {
        const jsonEdit = props.editing[rule.id];
        const formEdit = props.formEditing[rule.id];
        const schema = props.formRegistry[rule.key];

        return (
          <Card key={rule.id} variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  gap={1}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6" sx={{ fontSize: 18 }}>
                        {rule.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={rule.severity}
                        color={severityColor(rule.severity)}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {rule.key}
                    </Typography>
                    {rule.description && (
                      <Typography variant="body2" color="text.secondary">
                        {rule.description}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Ativa</Typography>
                    <Switch
                      checked={rule.enabled}
                      onChange={(e) => props.onToggleRule(rule.id, e.target.checked)}
                    />
                  </Stack>
                </Stack>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Parâmetros
                  </Typography>

                  {!formEdit && !jsonEdit && (
                    <Stack spacing={1}>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: "grey.100",
                          overflowX: "auto",
                          fontSize: 12,
                        }}
                      >
                        {JSON.stringify(rule.params, null, 2)}
                      </Box>

                      <Stack direction="row" spacing={1}>
                        {schema && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => props.onStartFormEdit(rule.id)}
                          >
                            Editar por formulário
                          </Button>
                        )}

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => props.onStartEditParams(rule.id)}
                        >
                          Modo avançado JSON
                        </Button>
                      </Stack>
                    </Stack>
                  )}

                  {formEdit && schema && (
                    <Stack spacing={1.25}>
                      {schema.fields.map((field) => {
                        const value = formEdit.params[field.key];
                        const options = getSourceOptions(field, props.employees, props.roles);

                        if (field.type === "number") {
                          return (
                            <TextField
                              key={field.key}
                              type="number"
                              label={field.label}
                              value={typeof value === "number" ? value : ""}
                              onChange={(e) =>
                                props.onUpdateFormField(
                                  rule.id,
                                  field.key,
                                  e.target.value === "" ? undefined : Number(e.target.value),
                                )
                              }
                              slotProps={{
                                htmlInput: {
                                  min: field.min,
                                  max: field.max,
                                  step: field.step ?? 1,
                                },
                              }}
                            />
                          );
                        }

                        if (field.type === "boolean") {
                          return (
                            <FormControlLabel
                              key={field.key}
                              control={
                                <Checkbox
                                  checked={Boolean(value)}
                                  onChange={(e) =>
                                    props.onUpdateFormField(rule.id, field.key, e.target.checked)
                                  }
                                />
                              }
                              label={field.label}
                            />
                          );
                        }

                        if (field.type === "select") {
                          return (
                            <FormControl key={field.key} fullWidth>
                              <InputLabel>{field.label}</InputLabel>
                              <Select
                                label={field.label}
                                value={typeof value === "string" ? value : ""}
                                onChange={(e) =>
                                  props.onUpdateFormField(
                                    rule.id,
                                    field.key,
                                    String(e.target.value),
                                  )
                                }
                              >
                                {options.map((option) => (
                                  <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          );
                        }

                        const selected = Array.isArray(value)
                          ? value.filter((item): item is string => typeof item === "string")
                          : [];

                        return (
                          <FormControl key={field.key} fullWidth>
                            <InputLabel>{field.label}</InputLabel>
                            <Select
                              multiple
                              input={<OutlinedInput label={field.label} />}
                              value={selected}
                              onChange={(e) => {
                                const next =
                                  typeof e.target.value === "string"
                                    ? e.target.value.split(",")
                                    : (e.target.value as string[]);

                                props.onUpdateFormField(rule.id, field.key, next);
                              }}
                              renderValue={(selectedValues) =>
                                (selectedValues as string[])
                                  .map(
                                    (id) => options.find((option) => option.value === id)?.label ?? id,
                                  )
                                  .join(", ")
                              }
                            >
                              {options.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        );
                      })}

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => props.onSaveFormEdit(rule.id)}
                        >
                          Salvar formulário
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => props.onStartEditParams(rule.id)}
                        >
                          Modo avançado JSON
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => props.onCancelFormEdit(rule.id)}
                        >
                          Cancelar
                        </Button>
                      </Stack>
                    </Stack>
                  )}

                  {jsonEdit && (
                    <Stack spacing={1}>
                      <TextField
                        multiline
                        minRows={6}
                        value={jsonEdit.text}
                        onChange={(e) => props.onChangeParamsDraft(rule.id, e.target.value)}
                        error={Boolean(jsonEdit.error)}
                        helperText={jsonEdit.error ?? "Use um objeto JSON válido."}
                      />

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => props.onSaveParams(rule.id)}
                        >
                          Salvar JSON
                        </Button>
                        {schema && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => props.onStartFormEdit(rule.id)}
                          >
                            Voltar ao formulário
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => props.onCancelEditParams(rule.id)}
                        >
                          Cancelar
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
