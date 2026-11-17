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
  Tooltip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardActionArea,
  CardContent,
  Fab,
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
import AssessmentIcon from "@mui/icons-material/Assessment";
import HomeIcon from "@mui/icons-material/Home";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import PublicIcon from "@mui/icons-material/Public";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StyleIcon from "@mui/icons-material/Style";
import CasinoIcon from "@mui/icons-material/Casino";
import CloseIcon from "@mui/icons-material/Close";

// Components
import TownPieCharts from "./components/TownPieCharts";
import BarChartsView from "./components/BarChartsView";
import GameTable from "./components/GameTable";
import TownDetailsView from "./components/TownDetailsView";
import HazardControls from "./components/HazardControls";
import CardControls from "./components/CardControls";
import StageBar from "./components/StageBar";
import DividendsDialog from "./components/DividendsDialog";
import EndEarlyDialog from "./components/EndEarlyDialog";
import GameSummaryDialog from "./components/GameSummaryDialog";
import TrainingLink from "../common/TrainingLink";
import { MEDIA_CONFIG } from "../../constants/mediaConfig";
import { primaryColor } from "../../constants/palette";
import { allCards } from "../../constants/cards";
import { getTotalRounds } from "../../game/options.js";

const drawerWidth = 500;

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
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const Game = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const {
    loading,
    error,
    currentSession,
    currentRound,
    currentStage,
    towns,
    roundEvents,
    roundEventDocs,
    roundStats,
    townCardPlays,
    townCardPlayDocs,
    loadSession,
    startGame,
    changeStage,
    settleRound,
    applyHazard,
    playCard,
    addCardPlayAtRound,
    removeCardPlay,
    updatePlayerCount,
    clearError,
    updateTown,
    revertToPreviousState,
    canRevert,
  } = useGame();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [dividendsDialogOpen, setDividendsDialogOpen] = useState(false);
  const [endEarlyDialogOpen, setEndEarlyDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [showOpeningScreen, setShowOpeningScreen] = useState(false);
  const [floatingControlsOpen, setFloatingControlsOpen] = useState(false);
  const [videoModal, setVideoModal] = useState({ open: false, title: "", src: "" });
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    loadSession(sessionId);
  }, [sessionId]);

  const totalRounds = currentSession ? getTotalRounds(currentSession) : 5;
  const hazardCountThisRound = (roundEvents[currentRound] || []).length;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const navigateToDashboard = () => {
    navigate("/");
  };

  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleStartGame = async () => {
    const updated = await startGame();
    if (updated) {
      showNotification("Game started! Round 1 (Adapt stage) begins.", "success");
    }
  };

  const handleChangeStage = async (targetStage) => {
    const updated = await changeStage(targetStage);
    if (updated) {
      const stageLabels = {
        adaptation: "Adapt",
        hazard: "Event",
        review: "Review",
      };
      showNotification(
        `Moved to ${stageLabels[targetStage] || targetStage} stage`,
        "info"
      );
    }
  };

  const handleConfirmSettleRound = async () => {
    const settlingRound = currentRound;
    const updated = await settleRound({ endEarly: false });
    if (updated) {
      setDividendsDialogOpen(false);
      if (!updated.isActive) {
        showNotification("Game completed! Viewing summary.", "success");
        setSummaryDialogOpen(true);
      } else {
        showNotification(
          `Round ${settlingRound} settled! Dividends awarded. Welcome to Round ${updated.currentRound}.`,
          "success"
        );
      }
    }
  };

  const handleConfirmEndEarly = async () => {
    const updated = await settleRound({ endEarly: true });
    if (updated) {
      setEndEarlyDialogOpen(false);
      showNotification("Game ended early and settled. Viewing summary.", "info");
      setSummaryDialogOpen(true);
    }
  };

  const handleUpdateTownName = async (
    townId,
    newName,
    fullTownUpdate = null
  ) => {
    try {
      const town = towns.find((t) => t.id === townId);
      if (!town) {
        throw new Error(`Town with ID ${townId} not found`);
      }

      const updatedTown = fullTownUpdate || {
        ...town,
        name: newName,
      };

      const result = await updateTown(updatedTown);

      if (result) {
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
      showNotification("Failed to update town information", "error");
    }
  };

  const handleRevert = async () => {
    const result = await revertToPreviousState();
    if (result) {
      showNotification("Reverted last move in this round", "success");
    }
  };

  const handleApplyHazard = async (hazardId) => {
    const result = await applyHazard(hazardId);
    if (result) {
      setDrawerOpen(false);
      showNotification("Applied hazard to all towns", "warning");
    }
  };

  const handlePlayCard = async (townId, cardId) => {
    try {
      const town = towns.find((t) => t.id === townId);
      const card = allCards.find((c) => c.id === cardId);
      if (!town || !card) return;

      if (town.effortPoints < card.cost) {
        showNotification(
          `Not enough effort points! ${town.name} has ${town.effortPoints} points, but needs ${card.cost}.`,
          "error"
        );
        return;
      }

      const result = await playCard(townId, cardId);
      if (result) {
        showNotification(
          `Applied ${card.name} to ${town?.name || "town"} (-${card.cost} EP)`,
          "info"
        );
      }
    } catch (err) {
      console.error("Error playing card:", err);
      showNotification(err.message || "Failed to play card", "error");
    }
  };

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

  if (!loading && !currentSession) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: 2,
          p: 3,
        }}
      >
        <Alert severity="error">{error || "Game not found"}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={navigateToDashboard}
        >
          Back to Dashboard
        </Button>
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
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
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
            {currentSession?.name || "Workshop"} ·{" "}
            {currentStage === "setup"
              ? "Setup"
              : currentStage === "complete"
              ? "Completed"
              : `Year ${2050 + currentRound} (Round ${currentRound}/${totalRounds})`}
          </Typography>

          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<HomeIcon />}
            onClick={() => {
              setShowOpeningScreen(true);
              setActiveTab(0);
            }}
            sx={{
              mr: 1.5,
              borderColor: "white",
              color: "white",
              "&:hover": {
                borderColor: "white",
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Opening Screen
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<OndemandVideoIcon />}
            onClick={() => {
              setVideoError(false);
              setVideoModal({
                open: true,
                title: "NESH Explainer",
                src: MEDIA_CONFIG.neshExplainerVideo,
              });
            }}
            sx={{
              mr: 1.5,
              borderColor: "white",
              color: "white",
              "&:hover": {
                borderColor: "white",
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            NESH Explainer
          </Button>

          <TrainingLink
            color="inherit"
            variant="outlined"
            size="small"
            sx={{
              mr: 1.5,
              borderColor: "white",
              color: "white",
              "&:hover": {
                borderColor: "white",
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          />

          {/* Undo button */}
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

          {currentStage === "setup" && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartGame}
              disabled={loading}
            >
              Start Game
            </Button>
          )}

          {currentStage === "review" && (
            <Button
              variant="contained"
              color="success"
              startIcon={<DoneIcon />}
              onClick={() => setDividendsDialogOpen(true)}
              disabled={loading}
            >
              {currentRound >= totalRounds ? "Finish Game" : "Settle Round"}
            </Button>
          )}

          {currentStage === "complete" && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AssessmentIcon />}
              onClick={() => setSummaryDialogOpen(true)}
            >
              Summary
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            maxWidth: "100vw",
            boxSizing: "border-box",
            bgcolor: "#f8f8f8",
          },
        }}
      >
        <Toolbar>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Facilitator Controls
            </Typography>
            <IconButton onClick={handleDrawerToggle} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </Toolbar>
        <Divider />
        <Box sx={{ overflow: "auto", p: 2 }}>
          <CardControls
            towns={towns}
            onPlayCard={handlePlayCard}
            disabled={loading || currentRound === 0 || !currentSession?.isActive}
            currentRound={currentRound}
            currentStage={currentStage}
            townCardPlayDocs={townCardPlayDocs}
            onRemoveCardPlay={removeCardPlay}
          />

          <Divider sx={{ my: 2 }} />

          <HazardControls
            onApplyHazard={handleApplyHazard}
            disabled={loading || currentRound === 0 || !currentSession?.isActive}
            currentRound={currentRound}
            currentStage={currentStage}
            digitalWheelEnabled={currentSession?.digitalWheelEnabled ?? true}
            hazardCountThisRound={hazardCountThisRound}
          />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Facilitated Stage Bar */}
        <StageBar
          session={currentSession}
          currentRound={currentRound}
          currentStage={currentStage}
          hazardCountThisRound={hazardCountThisRound}
          loading={loading}
          onStartGame={handleStartGame}
          onChangeStage={handleChangeStage}
          onOpenDividends={() => setDividendsDialogOpen(true)}
          onOpenEndEarly={() => setEndEarlyDialogOpen(true)}
          onOpenSummary={() => setSummaryDialogOpen(true)}
          onUpdatePlayerCount={updatePlayerCount}
          onOpenControlsDrawer={() => setDrawerOpen(true)}
        />

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

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          {currentRound === 0 || showOpeningScreen ? (
            <Paper sx={{ p: 4, borderRadius: 2, maxWidth: 960, mx: "auto" }}>
              <Typography variant="h4" gutterBottom fontWeight="bold" align="center">
                Welcome to The Heat Is On!
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Manage your towns across {totalRounds} {totalRounds === 1 ? "year" : "years"} of climate hazards and adaptations.
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardActionArea
                      onClick={() => {
                        setVideoError(false);
                        setVideoModal({
                          open: true,
                          title: "Time Machine",
                          src: MEDIA_CONFIG.timeMachineVideo,
                        });
                      }}
                      sx={{ p: 3, textAlign: "center" }}
                    >
                      <CardContent>
                        <AccessTimeIcon sx={{ fontSize: 56, color: "primary.main", mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          Time Machine
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardActionArea
                      onClick={() => {
                        setVideoError(false);
                        setVideoModal({
                          open: true,
                          title: "Global Scenario",
                          src: MEDIA_CONFIG.globalScenarioVideo,
                        });
                      }}
                      sx={{ p: 3, textAlign: "center" }}
                    >
                      <CardContent>
                        <PublicIcon sx={{ fontSize: 56, color: "secondary.main", mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          Global Scenario
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "center" }}>
                {currentRound === 0 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartGame}
                    disabled={loading}
                  >
                    Start Game (Year 2051)
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => setShowOpeningScreen(false)}
                  >
                    Return to Live Dashboard
                  </Button>
                )}
              </Box>
            </Paper>
          ) : (
            <>
              <TownPieCharts towns={towns} currentStage={currentStage} />
              <BarChartsView towns={towns} />

              {/* Floating expandable stage controls panel */}
              {floatingControlsOpen && (
                <Paper
                  elevation={8}
                  sx={{
                    position: "fixed",
                    bottom: 88,
                    right: 24,
                    width: { xs: "calc(100vw - 32px)", sm: 400 },
                    maxHeight: "75vh",
                    overflowY: "auto",
                    p: 2,
                    borderRadius: 3,
                    zIndex: theme.zIndex.drawer + 1,
                  }}
                >
                  {currentStage === "adaptation" && (
                    <CardControls
                      towns={towns}
                      onPlayCard={handlePlayCard}
                      disabled={loading || !currentSession?.isActive}
                      currentRound={currentRound}
                      currentStage={currentStage}
                      townCardPlayDocs={townCardPlayDocs}
                      onRemoveCardPlay={removeCardPlay}
                    />
                  )}
                  {currentStage === "hazard" && (
                    <HazardControls
                      onApplyHazard={handleApplyHazard}
                      disabled={loading || !currentSession?.isActive}
                      currentRound={currentRound}
                      currentStage={currentStage}
                      digitalWheelEnabled={currentSession?.digitalWheelEnabled ?? true}
                      hazardCountThisRound={hazardCountThisRound}
                    />
                  )}
                  {currentStage === "review" && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Review: How resilient is Adaptania now?
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Flip the town cards to inspect NESH resilience bars and compare across towns.
                      </Typography>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={() => {
                          setFloatingControlsOpen(false);
                          setDividendsDialogOpen(true);
                        }}
                        disabled={loading}
                      >
                        Proceed to Reward for effort
                      </Button>
                    </Box>
                  )}
                  {currentStage === "complete" && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Workshop Complete
                      </Typography>
                      <Button
                        variant="contained"
                        color="secondary"
                        fullWidth
                        startIcon={<AssessmentIcon />}
                        onClick={() => {
                          setFloatingControlsOpen(false);
                          setSummaryDialogOpen(true);
                        }}
                      >
                        Open Workshop Reflection
                      </Button>
                    </Box>
                  )}
                </Paper>
              )}

              <Fab
                variant="extended"
                color={
                  floatingControlsOpen
                    ? "default"
                    : currentStage === "hazard"
                    ? "warning"
                    : currentStage === "review"
                    ? "success"
                    : "primary"
                }
                onClick={() => setFloatingControlsOpen((prev) => !prev)}
                sx={{
                  position: "fixed",
                  bottom: 24,
                  right: 24,
                  zIndex: theme.zIndex.drawer + 1,
                  fontWeight: "bold",
                }}
              >
                {floatingControlsOpen ? (
                  <CloseIcon sx={{ mr: 1 }} />
                ) : currentStage === "hazard" ? (
                  <CasinoIcon sx={{ mr: 1 }} />
                ) : (
                  <StyleIcon sx={{ mr: 1 }} />
                )}
                {floatingControlsOpen
                  ? "Close"
                  : currentStage === "adaptation"
                  ? "Play Cards"
                  : currentStage === "hazard"
                  ? "Hazard Wheel"
                  : currentStage === "review"
                  ? "Reward for effort"
                  : "Summary"}
              </Fab>
            </>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TownDetailsView
            towns={towns}
            onUpdateTownName={handleUpdateTownName}
            disabled={!currentSession?.isActive}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <GameTable
            towns={towns}
            roundEvents={roundEvents}
            townCardPlays={townCardPlays}
            townCardPlayDocs={townCardPlayDocs}
            currentRound={currentRound}
            totalRounds={totalRounds}
            onRemoveCardPlay={removeCardPlay}
            onAddCardPlayAtRound={addCardPlayAtRound}
            loading={loading}
          />
        </TabPanel>
      </Box>

      {/* Video Player Modal (Time Machine / Global Scenario / NESH Explainer) */}
      <Dialog
        open={videoModal.open}
        onClose={() => setVideoModal({ open: false, title: "", src: "" })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{videoModal.title}</DialogTitle>
        <DialogContent dividers>
          {videoError ? (
            <Alert severity="info">
              Video placeholder configured at <code>{videoModal.src}</code>. Drop the video file into <code>public{videoModal.src}</code> when ready.
            </Alert>
          ) : (
            <Box sx={{ width: "100%", textAlign: "center" }}>
              <video
                src={videoModal.src}
                controls
                autoPlay
                onError={() => setVideoError(true)}
                style={{ width: "100%", maxHeight: "65vh", borderRadius: 8 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVideoModal({ open: false, title: "", src: "" })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Round Settlement / Reward for effort Dialog */}
      <DividendsDialog
        open={dividendsDialogOpen}
        onClose={() => setDividendsDialogOpen(false)}
        onConfirm={handleConfirmSettleRound}
        towns={towns}
        currentRound={currentRound}
        totalRounds={totalRounds}
        session={currentSession}
        roundStats={roundStats}
        loading={loading}
      />

      {/* End Game Early Dialog */}
      <EndEarlyDialog
        open={endEarlyDialogOpen}
        onClose={() => setEndEarlyDialogOpen(false)}
        onConfirm={handleConfirmEndEarly}
        currentRound={currentRound}
        totalRounds={totalRounds}
        towns={towns}
        loading={loading}
      />

      {/* End-of-Game Summary Dialog */}
      <GameSummaryDialog
        open={summaryDialogOpen}
        onClose={() => setSummaryDialogOpen(false)}
        session={currentSession}
        towns={towns}
        roundEventDocs={roundEventDocs}
        roundStats={roundStats}
        townCardPlayDocs={townCardPlayDocs}
      />

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
