// src/components/Game/index.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../../contexts/GameContext";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Alert,
  Drawer,
  Divider,
  Tabs,
  Tab,
  Paper,
  Snackbar,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import UndoIcon from "@mui/icons-material/Undo";
import DoneIcon from "@mui/icons-material/Done";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import HistoryIcon from "@mui/icons-material/History";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

// Components
import TownPieCharts from "./components/TownPieCharts";
import BarChartsView from "./components/BarChartsView";
import GameTable from "./components/GameTable";
import TownDetailsView from "./components/TownDetailsView";
import HazardControls from "./components/HazardControls";
import CardControls from "./components/CardControls";
import { primaryColor } from "../../constants/palette";
import { SpaceBar } from "@mui/icons-material";
import { allCards } from "../../constants/cards";

// Drawer width
const drawerWidth = 500;

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`game-tabpanel-${index}`}
      aria-labelledby={`game-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Main Game component
 */
const Game = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Game Context
  const {
    loading,
    error,
    currentSession,
    currentRound,
    towns,
    roundEvents,
    townCardPlays,
    loadSession,
    advanceRound,
    applyHazard,
    playCard,
    refreshSessionData,
    clearError,
    updateTown,
    revertToPreviousState,
    canRevert,
  } = useGame();

  // Local state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Load session data
  useEffect(() => {
    loadSession(sessionId);
  }, [sessionId]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Navigate back to dashboard
  const navigateToDashboard = () => {
    navigate("/");
  };

  // Handle advance round
  const handleAdvanceRound = async () => {
    await advanceRound();

    if (currentRound === 5) {
      showNotification("Game completed successfully!", "success");

      // Optional: Add a slight delay before redirecting to dashboard
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } else {
      showNotification(
        currentRound === 0
          ? "Game started! Round 1 begins."
          : `Advanced to Round ${currentRound + 1}`,
        "success"
      );
    }
  };

  // Handle updating town name and other properties
  const handleUpdateTownName = async (
    townId,
    newName,
    fullTownUpdate = null
  ) => {
    try {
      // Find the town to update
      const town = towns.find((t) => t.id === townId);
      if (!town) {
        throw new Error(`Town with ID ${townId} not found`);
      }

      // Create updated town object
      let updatedTown;

      if (fullTownUpdate) {
        // If a full town update is provided, use it
        updatedTown = fullTownUpdate;
      } else {
        // Otherwise just update the name
        updatedTown = {
          ...town,
          name: newName,
        };
      }

      // Call the update function from context/service
      // This should handle loading state internally
      const result = await updateTown(updatedTown);

      if (result) {
        // Refresh session data to reflect changes
        await refreshSessionData();

        // Show appropriate notification
        if (
          fullTownUpdate &&
          fullTownUpdate.effortPoints !== town.effortPoints
        ) {
          showNotification(
            `Budget points updated to ${fullTownUpdate.effortPoints}`,
            "success"
          );
        } else {
          showNotification("Town name updated successfully", "success");
        }
      }
    } catch (err) {
      console.error("Failed to update town:", err);
      showNotification({
        message: "Failed to update town information",
        severity: "error",
      });
    }
  };

  // Handle revert
  const handleRevert = async () => {
    const result = await revertToPreviousState();
    if (result) {
      showNotification("Successfully reverted to previous state", "success");
    }
  };

  // Handle applying hazard
  const handleApplyHazard = async (hazardId) => {
    await applyHazard(hazardId);
    showNotification("Applied hazard to all towns", "warning");
  };

  // Handle playing card
  const handlePlayCard = async (townId, cardId) => {
    try {
      const town = towns.find((t) => t.id === townId);
      const card = allCards.find((c) => c.id === cardId);

      // Check if town has enough effort points
      if (town.effortPoints < card.cost) {
        showNotification(
          `Not enough effort points! ${town.name} has ${town.effortPoints} points, but needs ${card.cost}.`,
          "error"
        );
        return;
      }

      await playCard(townId, cardId);

      showNotification(
        `Applied adaptation card to ${town?.name || "town"} (-${
          card.cost
        } effort points)`,
        "info"
      );
    } catch (error) {
      console.error("Error playing card:", error);
      showNotification(error.message || "Failed to play card", "error");
    }
  };

  // Show notification
  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle notification close
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Loading indicator
  if (loading && !currentSession) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography>Loading game data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="absolute"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: "#E38A6C",
          boxShadow: 3,
          // width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          // ml: { sm: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          {/* Drawer toggle button (visible on all screen sizes) */}
          <Tooltip title={drawerOpen ? "Hide Controls" : "Show Controls"}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>

          <IconButton
            color="inherit"
            edge="start"
            onClick={navigateToDashboard}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Current Year: {2050 + currentRound}
          </Typography>

          {/* Revert button */}
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleRevert}
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
            color={currentRound === 5 ? "success" : "secondary"}
            startIcon={currentRound === 5 ? <DoneIcon /> : <PlayArrowIcon />}
            onClick={handleAdvanceRound}
            disabled={loading || currentRound > 5}
          >
            {currentRound === 0
              ? "Start Game"
              : currentRound === 5
              ? "Finish Game"
              : "Next Year"}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        variant={"temporary"}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          //width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#f8f8f8",
          },
        }}
      >
        <Toolbar>
          {/* Add drawer header with a close button */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Game Controls
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {/* <IconButton onClick={handleDrawerToggle}>
              <ChevronLeftIcon />
            </IconButton> */}
          </Box>
        </Toolbar>
        <Divider />
        <Box sx={{ overflow: "auto", p: 2 }}>
          <HazardControls
            onApplyHazard={handleApplyHazard}
            disabled={loading || currentRound === 0}
            currentRound={currentRound}
          />

          <Divider sx={{ my: 2 }} />

          <CardControls
            towns={towns}
            onPlayCard={handlePlayCard}
            disabled={loading || currentRound === 0}
            currentRound={currentRound}
          />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          // maxWidth: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          // ml: { sm: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: primaryColor,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}
        {/* Tabs */}
        <Paper sx={{ borderRadius: 1, mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              icon={<DashboardIcon />}
              label="Dashboard"
              iconPosition="start"
            />
            <Tab
              icon={<LocationCityIcon />}
              label="Town Details"
              iconPosition="start"
            />
            <Tab
              icon={<HistoryIcon />}
              label="Game History"
              iconPosition="start"
            />
          </Tabs>
        </Paper>
        {/* Rest of the component remains the same */}
        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          {currentRound === 0 ? (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Welcome to The Heat Is On!
              </Typography>
              <Typography variant="body1" paragraph>
                In this game, you'll manage 5 towns facing climate hazards over
                5 rounds. Each town has different vulnerability levels to
                hazards: bushfires, floods, storms, heatwaves, and biohazards.
              </Typography>
              <Typography variant="body1">
                Click "Start Game" to begin the first round. During each round,
                you can:
              </Typography>
              <ul>
                <li>Apply hazard events to test town resilience</li>
                <li>Play adaptation cards to improve town resilience</li>
                <li>Track progress through charts and tables</li>
              </ul>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Tip:</strong> If any town's resilience score drops below
                20 in any category, all other categories will receive a -10
                point penalty. Use adaptation cards strategically to maintain
                resilience across all towns.
              </Typography>
            </Paper>
          ) : (
            <>
              <TownPieCharts towns={towns} />

              <BarChartsView towns={towns} />
            </>
          )}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <TownDetailsView
            towns={towns}
            onUpdateTownName={handleUpdateTownName}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <GameTable
            towns={towns}
            roundEvents={roundEvents}
            townCardPlays={townCardPlays}
            currentRound={currentRound}
          />
        </TabPanel>
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Game;
