import React from "react";
import { NavLink } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

type NavItem = {
  label: string;
  to: string;
};

type Props = {
  title: string;
  navItems: NavItem[];
  currentPath: string;

  isMobile: boolean;
  mobileOpen: boolean;

  onToggleMobileDrawer: () => void;
  onCloseMobileDrawer: () => void;
  onNavItemClick: () => void;
  onResetAll: () => void;

  content: React.ReactNode;
};

const DRAWER_WIDTH = 260;

export function AppShellView(props: Props) {
  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Menu
        </Typography>
      </Toolbar>

      <Divider />

      <List sx={{ py: 1 }}>
        {props.navItems.map((item) => {
          const selected =
            props.currentPath === item.to ||
            props.currentPath.startsWith(item.to + "/");

          return (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              selected={selected}
              onClick={props.onNavItemClick}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 2,
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ p: 2 }}>
        <Button variant="outlined" color="warning" fullWidth onClick={props.onResetAll}>
          Iniciar próximo mês
        </Button>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          v0.1 (MVP)
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {props.isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={props.onToggleMobileDrawer}
              aria-label="Open navigation menu"
              sx={{ mr: 1 }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>☰</span>
            </IconButton>
          )}

          <Typography variant="h6" component="div" noWrap sx={{ flex: 1 }}>
            {props.title}
          </Typography>

          {!props.isMobile && (
            <Button color="inherit" variant="outlined" onClick={props.onResetAll}>
              Reiniciar
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer (mobile: temporary, desktop: permanent) */}
      {props.isMobile ? (
        <Drawer
          variant="temporary"
          open={props.mobileOpen}
          onClose={props.onCloseMobileDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: {
                xs: "min(86vw, 320px)",
                sm: DRAWER_WIDTH,
              },
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 1, sm: 2, md: 3 },
          py: { xs: 1.5, sm: 2 },
          width: "100%",
        }}
      >
        {/* Push content below AppBar */}
        <Toolbar />

        {props.content}
      </Box>
    </Box>
  );
}
