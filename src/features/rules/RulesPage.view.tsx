import type { RuleConfig } from "../../domain/types/rules";
import type { RuleId } from "../../domain/types/ids";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

type EditState = {
  text: string;
  error?: string;
};

type Props = {
  rules: RuleConfig[];
  hasRules: boolean;
  editing: Record<RuleId, EditState>;

  onEnsureDefaultRules: () => void;
  onResetToDefaults: () => void;
  onRestoreRulesDefaults: () => void;

  onToggleRule: (ruleId: RuleId, enabled: boolean) => void;
  onStartEditParams: (ruleId: RuleId) => void;
  onCancelEditParams: (ruleId: RuleId) => void;
  onChangeParamsDraft: (ruleId: RuleId, text: string) => void;
  onSaveParams: (ruleId: RuleId) => void;
};

function severityColor(severity: RuleConfig["severity"]): "error" | "warning" {
  return severity === "HARD" ? "error" : "warning";
}

export function RulesPageView(props: Props) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">Regras</Typography>
        <Typography variant="body2" color="text.secondary">
          Ative/desative regras e ajuste os parâmetros em JSON quando necessário.
        </Typography>
      </Box>

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
        const edit = props.editing[rule.id];

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

                  {!edit ? (
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
                      <Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => props.onStartEditParams(rule.id)}
                        >
                          Editar parâmetros
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    <Stack spacing={1}>
                      <TextField
                        multiline
                        minRows={6}
                        value={edit.text}
                        onChange={(e) =>
                          props.onChangeParamsDraft(rule.id, e.target.value)
                        }
                        error={Boolean(edit.error)}
                        helperText={edit.error ?? "Use um objeto JSON válido."}
                      />

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => props.onSaveParams(rule.id)}
                        >
                          Salvar JSON
                        </Button>
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
