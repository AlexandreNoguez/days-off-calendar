"use client";

import Link from "next/link";
import type { PublicUser } from "../lib/types";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SunnyIcon from "@mui/icons-material/Sunny";
import { useMainShell } from "./hooks/useMainShell";

const DRAWER_WIDTH = 256;

export function MainShell({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactNode;
}) {
  const shell = useMainShell(user);

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            Escala de Folgas
          </Typography>
          <Chip size="small" label={user.role} color={user.role === "ADMIN" ? "primary" : "default"} />
        </Stack>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {shell.visibleItems.map((item) => {
          const selected = shell.isSelected(item.href);
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={selected}
              sx={{ borderRadius: 1, my: 0.5 }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Logado como
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {user.displayName}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }} noWrap>
            Escala de Folgas
          </Typography>
          <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
            {user.displayName}
          </Typography>
          <Tooltip
            title={
              shell.themeMode.mode === "light"
                ? "Ativar modo escuro"
                : "Ativar modo claro"
            }
          >
            <Button
              color="inherit"
              onClick={shell.themeMode.toggleMode}
              startIcon={
                shell.themeMode.mode === "light" ? <DarkModeIcon /> : <SunnyIcon />
              }
            >
              {shell.themeMode.mode === "light" ? "Escuro" : "Claro"}
            </Button>
          </Tooltip>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={shell.logout}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
          display: { xs: "none", md: "block" },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 1.5, sm: 2, md: 3 },
          py: 2,
        }}
      >
        <Toolbar />
        <Box sx={{ display: { xs: "block", md: "none" }, mb: 2, overflowX: "auto" }}>
          <Stack direction="row" spacing={1}>
            {shell.visibleItems.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                variant={shell.isSelected(item.href) ? "contained" : "outlined"}
                size="small"
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Box>
        {children}
      </Box>
    </Box>
  );
}
