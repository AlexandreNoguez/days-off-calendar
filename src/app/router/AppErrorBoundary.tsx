import { Button, Container, Paper, Stack, Typography } from "@mui/material";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Erro inesperado na navegação da aplicação.";
}

export function AppErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Algo deu errado</Typography>
          <Typography variant="body2" color="text.secondary">
            Ocorreu um erro ao carregar esta página.
          </Typography>
          <Typography
            variant="body2"
            component="pre"
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: "grey.100",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {getErrorMessage(error)}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Recarregar página
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
