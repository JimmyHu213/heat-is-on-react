// src/components/Game/layout/GameLayout.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import UndoIcon from "@mui/icons-material/Undo";

// Drawer width
const drawerWidth = 280;

/**
 * Game layout component providing app bar, drawer, and content area
 */
const GameLayout = ({
  children,
  sidebarContent,
  title,
  currentRound,
  loading,
  canRevert,
  onRevert,
  onAdvanceRound,
  disableAdvance,
  notification,
  onCloseNotification,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  // Local state for drawer
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Navigate back to dashboard
  const navigateToDashboard = () => {
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: theme.palette.primary.main,
          backgroundImage: "linear-gradient(to right, #4D8E8B, #247266)",
          boxShadow: 3,
          width: { md: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          ml: { md: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <IconButton
            color="inherit"
            edge="start"
            onClick={navigateToDashboard}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}: {currentRound}/5
          </Typography>

          {/* Revert button */}
          <Button
            variant="outlined"
            color="inherit"
            onClick={onRevert}
            disabled={loading || !canRevert}
            startIcon={<UndoIcon />}
            sx={{
              mr: 2,
              borderColor: "white",
              "&:hover": {
                borderColor: "white",
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Undo
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<PlayArrowIcon />}
            onClick={onAdvanceRound}
            disabled={loading || disableAdvance}
            sx={{
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            {currentRound === 0 ? "Start Game" : "Next Round"}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            background: theme.palette.background.default,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ overflow: "auto", p: 2 }}>{sidebarContent}</Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          ml: { md: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: "background.default",
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>

      {/* Notifications */}
      {notification && (
        <Snackbar
          open={notification.open}
          autoHideDuration={notification.duration || 4000}
          onClose={onCloseNotification}
          anchorOrigin={{
            vertical: notification.vertical || "bottom",
            horizontal: notification.horizontal || "center",
          }}
        >
          <Alert
            onClose={onCloseNotification}
            severity={notification.severity || "success"}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default GameLayout;
