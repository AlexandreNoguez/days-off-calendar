import type { Employee, Role } from "../../domain/types/employees";
import type { RuleId } from "../../domain/types/ids";
import type { RuleConfig } from "../../domain/types/rules";
import type { RuleFieldSpec, RuleFormSchema } from "./ruleFormRegistry";
import type { CustomRuleTemplate } from "./useRulesPage";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
  Chip,
} from "@mui/material";

type EditState = {
  text: string;
  error?: string;
};

type FormEditState = {
  params: Record<string, unknown>;
};

type CreateRuleDraft = {
  template: CustomRuleTemplate;
  employeeAId: string;
  employeeBId: string;
  substituteId: string;
  substitutedIds: string[];
  cookRoleId: string;
  sundayOffCount: number;
  severity: RuleConfig["severity"];
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

  isCreateDialogOpen: boolean;
  createStep: number;
  createError?: string;
  createRuleDraft: CreateRuleDraft;

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

  onOpenCreateRuleDialog: () => void;
  onCloseCreateRuleDialog: () => void;
  onChangeCreateStep: (step: number) => void;
  onUpdateCreateRuleDraft: (patch: Partial<CreateRuleDraft>) => void;
  onCreateCustomRule: () => void;
};

type Option = {
  value: string;
  label: string;
};

const createRuleSteps = ["Tipo", "Participantes", "Condição e resultado"];

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
  const employeeOptions = props.employees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));

  const roleOptions = props.roles.map((role) => ({ value: role.id, label: role.name }));

  const canBackCreateStep = props.createStep > 0;
  const canAdvanceCreateStep = props.createStep < createRuleSteps.length - 1;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">Regras</Typography>
        <Typography variant="body2" color="text.secondary">
          Friendly forms are default and JSON stays available as an optional
          advanced mode.
        </Typography>
      </Box>

      <Alert severity="info">
        Friendly form registry is ready for {props.formReadyRulesCount} rules in
        this first step.
      </Alert>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button variant="contained" onClick={props.onEnsureDefaultRules}>
          Carregar regras padrão
        </Button>
        <Button variant="outlined" onClick={props.onResetToDefaults}>
          Restaurar defaults
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={props.onRestoreRulesDefaults}
        >
          Restaurar defaults (seed)
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={props.onOpenCreateRuleDialog}
        >
          Nova regra personalizada
        </Button>
      </Stack>

      {!props.hasRules && (
        <Alert severity="info">
          Ainda não há regras cadastradas. Clique em "Carregar regras padrão".
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
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
                        onChange={(e) =>
                          props.onToggleRule(rule.id, e.target.checked)
                        }
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
                          const options = getSourceOptions(
                            field,
                            props.employees,
                            props.roles,
                          );

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
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value),
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
                                      props.onUpdateFormField(
                                        rule.id,
                                        field.key,
                                        e.target.checked,
                                      )
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
                                    <MenuItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            );
                          }

                          const selected = Array.isArray(value)
                            ? value.filter(
                                (item): item is string =>
                                  typeof item === "string",
                              )
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

                                  props.onUpdateFormField(
                                    rule.id,
                                    field.key,
                                    next,
                                  );
                                }}
                                renderValue={(selectedValues) =>
                                  (selectedValues as string[])
                                    .map(
                                      (id) =>
                                        options.find(
                                          (option) => option.value === id,
                                        )?.label ?? id,
                                    )
                                    .join(", ")
                                }
                              >
                                {options.map((option) => (
                                  <MenuItem
                                    key={option.value}
                                    value={option.value}
                                  >
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
                          onChange={(e) =>
                            props.onChangeParamsDraft(rule.id, e.target.value)
                          }
                          error={Boolean(jsonEdit.error)}
                          helperText={
                            jsonEdit.error ?? "Use um objeto JSON válido."
                          }
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
      </Box>

      <Dialog
        open={props.isCreateDialogOpen}
        onClose={props.onCloseCreateRuleDialog}
        fullWidth
      >
        <DialogTitle>Nova regra personalizada</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stepper activeStep={props.createStep} alternativeLabel>
              {createRuleSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {props.createError && (
              <Alert severity="error">{props.createError}</Alert>
            )}

            {props.createStep === 0 && (
              <Stack spacing={1.25}>
                {/* <Alert severity="info">
                  Se preferir, use os atalhos de template para começar mais
                  rápido.
                </Alert> */}

                {/* <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                  <Button
                    variant={props.createRuleDraft.template === "pair_cannot_both_off" ? "contained" : "outlined"}
                    onClick={() => props.onUpdateCreateRuleDraft({ template: "pair_cannot_both_off" })}
                  >
                    Par não pode folgar junto
                  </Button>
                  <Button
                    variant={props.createRuleDraft.template === "substitution_required" ? "contained" : "outlined"}
                    onClick={() => props.onUpdateCreateRuleDraft({ template: "substitution_required" })}
                  >
                    Substituição obrigatória
                  </Button>
                  <Button
                    variant={props.createRuleDraft.template === "cook_one_off_each_sunday" ? "contained" : "outlined"}
                    onClick={() => props.onUpdateCreateRuleDraft({ template: "cook_one_off_each_sunday" })}
                  >
                    1 folga de cozinheiro por domingo
                  </Button>
                </Stack> */}

                <FormControl fullWidth>
                  <InputLabel>Template de regra</InputLabel>
                  <Select
                    label="Template de regra"
                    value={props.createRuleDraft.template}
                    onChange={(e) =>
                      props.onUpdateCreateRuleDraft({
                        template: e.target.value as CustomRuleTemplate,
                      })
                    }
                  >
                    <MenuItem value="pair_cannot_both_off">
                      Par não pode folgar junto
                    </MenuItem>
                    <MenuItem value="substitution_required">
                      Substituição obrigatória
                    </MenuItem>
                    <MenuItem value="cook_one_off_each_sunday">
                      1 folga de cozinheiro por domingo
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Severidade</InputLabel>
                  <Select
                    label="Severidade"
                    value={props.createRuleDraft.severity}
                    onChange={(e) =>
                      props.onUpdateCreateRuleDraft({
                        severity: e.target.value as RuleConfig["severity"],
                      })
                    }
                  >
                    <MenuItem value="HARD">HARD (bloqueia validade)</MenuItem>
                    <MenuItem value="SOFT">SOFT (recomendação)</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}

            {props.createStep === 1 && (
              <>
                {props.createRuleDraft.template === "pair_cannot_both_off" && (
                  <Stack spacing={1.25}>
                    <FormControl fullWidth>
                      <InputLabel>Colaborador A</InputLabel>
                      <Select
                        label="Colaborador A"
                        value={props.createRuleDraft.employeeAId}
                        onChange={(e) =>
                          props.onUpdateCreateRuleDraft({
                            employeeAId: String(e.target.value),
                          })
                        }
                      >
                        {employeeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Colaborador B</InputLabel>
                      <Select
                        label="Colaborador B"
                        value={props.createRuleDraft.employeeBId}
                        onChange={(e) =>
                          props.onUpdateCreateRuleDraft({
                            employeeBId: String(e.target.value),
                          })
                        }
                      >
                        {employeeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                )}

                {props.createRuleDraft.template === "substitution_required" && (
                  <Stack spacing={1.25}>
                    <FormControl fullWidth>
                      <InputLabel>Substituto</InputLabel>
                      <Select
                        label="Substituto"
                        value={props.createRuleDraft.substituteId}
                        onChange={(e) =>
                          props.onUpdateCreateRuleDraft({
                            substituteId: String(e.target.value),
                          })
                        }
                      >
                        {employeeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Substituídos</InputLabel>
                      <Select
                        multiple
                        input={<OutlinedInput label="Substituídos" />}
                        value={props.createRuleDraft.substitutedIds}
                        onChange={(e) =>
                          props.onUpdateCreateRuleDraft({
                            substitutedIds:
                              typeof e.target.value === "string"
                                ? e.target.value.split(",")
                                : (e.target.value as string[]),
                          })
                        }
                        renderValue={(selected) =>
                          (selected as string[])
                            .map(
                              (id) =>
                                employeeOptions.find(
                                  (option) => option.value === id,
                                )?.label ?? id,
                            )
                            .join(", ")
                        }
                      >
                        {employeeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                )}

                {props.createRuleDraft.template ===
                  "cook_one_off_each_sunday" && (
                  <Stack spacing={1.25}>
                    <FormControl fullWidth>
                      <InputLabel>Cargo</InputLabel>
                      <Select
                        label="Cargo"
                        value={props.createRuleDraft.cookRoleId}
                        onChange={(e) =>
                          props.onUpdateCreateRuleDraft({
                            cookRoleId: String(e.target.value),
                          })
                        }
                      >
                        {roleOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      type="number"
                      label="Quantidade de folgas no domingo"
                      value={props.createRuleDraft.sundayOffCount}
                      onChange={(e) =>
                        props.onUpdateCreateRuleDraft({
                          sundayOffCount: Math.max(
                            1,
                            Number(e.target.value) || 1,
                          ),
                        })
                      }
                      slotProps={{ htmlInput: { min: 1, max: 7, step: 1 } }}
                    />
                  </Stack>
                )}
              </>
            )}

            {props.createStep === 2 && (
              <Alert severity="info">
                Revise os participantes e confirme para criar a regra
                personalizada com severidade {props.createRuleDraft.severity}.
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={props.onCloseCreateRuleDialog}>Fechar</Button>
          <Button
            onClick={() => props.onChangeCreateStep(props.createStep - 1)}
            disabled={!canBackCreateStep}
          >
            Voltar
          </Button>
          {canAdvanceCreateStep ? (
            <Button
              variant="contained"
              onClick={() => props.onChangeCreateStep(props.createStep + 1)}
            >
              Próximo
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={props.onCreateCustomRule}
            >
              Criar regra
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
