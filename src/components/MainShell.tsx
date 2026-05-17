"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

const DRAWER_WIDTH = 256;

type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { label: "Setup", href: "/setup" },
  { label: "Cadastros", href: "/cadastros" },
  { label: "Escala", href: "/schedule" },
  { label: "Exportar", href: "/export" },
  { label: "Administrador", href: "/admin", adminOnly: true },
];

export function MainShell({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleItems = navItems.filter((item) => !item.adminOnly || user.role === "ADMIN");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

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
        {visibleItems.map((item) => {
          const selected = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
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
            {visibleItems.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                variant={pathname === item.href ? "contained" : "outlined"}
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
