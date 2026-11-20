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
  Tabs,
  Tab,
  Paper,
  Snackbar,
  useTheme,
  useMediaQuery,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import UndoIcon from "@mui/icons-material/Undo";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import HistoryIcon from "@mui/icons-material/History";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HomeIcon from "@mui/icons-material/Home";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";

// Components
import TownPieCharts from "./components/TownPieCharts";
import HazardIcon from "../common/HazardIcon";
import WorkshopBanner from "../common/WorkshopBanner";
import GameTable from "./components/GameTable";
import TownDetailsView from "./components/TownDetailsView";
import HazardControls from "./components/HazardControls";
import CardControls from "./components/CardControls";
import StageBar from "./components/StageBar";
import EndEarlyDialog from "./components/EndEarlyDialog";
import GameSummaryDialog from "./components/GameSummaryDialog";
import TrainingLink from "../common/TrainingLink";
import HazardMedia from "./components/HazardMedia";
import { hazards } from "../../constants/hazards";
import { MEDIA_CONFIG } from "../../constants/mediaConfig";
import { primaryColor } from "../../constants/palette";
import { allCards } from "../../constants/cards";
import { getTotalRounds } from "../../game/options.js";
import { WHEEL_SLICES } from "../../game/wheel.js";

const gameHeaderColor = "#E38A6C";
const HAZARD_HEADLINES = {
  bushfire: "Bushfire breaks out!",
  flood: "Floodwaters are rising!",
  stormSurge: "Storm surge hits the coast!",
  heatwave: "The heat is on!",
  biohazard: "A biohazard is spreading!",
};

const hazardMediaSize = { width: "100%", aspectRatio: "16 / 9", maxHeight: "65vh" };

function HazardDialogTitle({ id, hazard, children, onClose, closeLabel }) {
  const color = WHEEL_SLICES.find((slice) => slice.id === hazard?.id)?.color;
  return (
    <DialogTitle
      id={id}
      sx={{
        position: "relative",
        px: 6,
        textAlign: "center",
        fontFamily: "Fredoka, sans-serif",
        fontSize: { xs: "1.25rem", sm: "1.65rem" },
        fontWeight: 600,
        color,
      }}
    >
      {children}
      <IconButton
        aria-label={closeLabel}
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
  );
}

function TabPanel(props) {
  const { children, value, index, compact, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`game-tabpanel-${index}`}
      aria-labelledby={`game-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: compact ? 0.5 : 2 }}>{children}</Box>}
    </div>
  );
}

const Game = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const wideScreen = useMediaQuery(theme.breakpoints.up("md"));

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
    updateDigitalWheel,
    clearError,
    updateTown,
    revertToPreviousState,
    canRevert,
  } = useGame();

  const [activeTab, setActiveTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [endEarlyDialogOpen, setEndEarlyDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [showOpeningScreen, setShowOpeningScreen] = useState(false);
  const [openTool, setOpenTool] = useState(null);
  const [videoModal, setVideoModal] = useState({ open: false, title: "", src: "" });
  const [videoError, setVideoError] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [chartPresentation, setChartPresentation] = useState(null);
  const [chartProgress, setChartProgress] = useState(0);

  useEffect(() => {
    loadSession(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (currentStage !== "hazard" || showOpeningScreen || navigator.connection?.saveData) return;

    let cancelled = false;
    async function preloadAnimations() {
      for (const src of Object.values(MEDIA_CONFIG.eventAnimations)) {
        if (cancelled) return;
        await new Promise((resolve) => {
          const image = new Image();
          image.fetchPriority = "low";
          image.onload = image.onerror = resolve;
          image.src = src;
        });
      }
    }
    preloadAnimations();
    return () => { cancelled = true; };
  }, [currentStage, showOpeningScreen]);

  const presentation = chartPresentation
    && chartPresentation.stage === currentStage
    && chartPresentation.sessionId === sessionId
    && chartPresentation.round === currentRound
    ? chartPresentation
    : null;

  useEffect(() => {
    if (presentation?.phase !== "animating") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setChartPresentation(null);
      return;
    }

    const startedAt = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / 1200);
      if (progress >= 1) {
        setChartPresentation(null);
        return;
      }
      setChartProgress(1 - (1 - progress) ** 2);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [presentation]);

  const totalRounds = currentSession ? getTotalRounds(currentSession) : 5;
  const hazardCountThisRound = (roundEvents[currentRound] || []).length;
  const busy = loading || Boolean(presentation);
  const announcedHazard = hazards.find((hazard) => hazard.id === presentation?.hazardId);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setOpenTool(null);
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
      setOpenTool(null);
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

  const handleSettleRound = async () => {
    const settlingRound = currentRound;
    const updated = await settleRound({ endEarly: false });
    if (updated) {
      if (!updated.isActive) {
        showNotification("Game completed! Viewing summary.", "success");
        setSummaryDialogOpen(true);
      } else {
        showNotification(
          `Round ${settlingRound} settled. Reward for effort awarded. Welcome to Round ${updated.currentRound}.`,
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
          showNotification("Town details saved", "success");
        }
      }
      return Boolean(result);
    } catch (err) {
      console.error("Failed to update town:", err);
      showNotification("Failed to update town information", "error");
      return false;
    }
  };

  const handleRevert = async () => {
    const result = await revertToPreviousState();
    if (result) {
      setChartPresentation(null);
      showNotification("Reverted last move in this round", "success");
    }
  };

  const handleApplyHazard = async (hazardId) => {
    if (presentation) return;
    const pending = { sessionId, round: currentRound, stage: currentStage, hazardId, before: towns, phase: "saving" };
    setChartProgress(0);
    setChartPresentation(pending);

    const result = await applyHazard(hazardId);
    if (result) {
      setOpenTool(null);
      setActiveTab(0);
      showNotification("Applied hazard to all towns", "warning");
    }
    setChartPresentation((current) => current !== pending ? current : result
      ? { ...pending, after: result.towns, phase: "playing" }
      : null);
  };

  const handlePlayCard = async (townId, cardId) => {
    if (presentation) return;
    let pending;
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

      pending = { sessionId, round: currentRound, stage: currentStage, before: [town], phase: "saving" };
      setChartProgress(0);
      setChartPresentation(pending);

      const result = await playCard(townId, cardId);
      setChartPresentation((current) => current !== pending ? current : result
        ? { ...pending, after: [result.town], phase: "animating" }
        : null);
      if (result) {
        setOpenTool(null);
        setActiveTab(0);
        showNotification(
          `Applied ${card.name} to ${town.name} (-${card.cost} EP)`,
          "info"
        );
      }
    } catch (err) {
      setChartPresentation((current) => current === pending ? null : current);
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

  const isOpeningScreen = currentRound === 0 || showOpeningScreen;
  const useSidebar = wideScreen && !isOpeningScreen;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: isOpeningScreen ? 1 : undefined,
        minHeight: isOpeningScreen ? undefined : "100vh",
      }}
    >
      {isOpeningScreen && <WorkshopBanner />}

      {/* App Bar */}
      {!isOpeningScreen && (
        <AppBar
          position="static"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: gameHeaderColor,
            boxShadow: 3,
            transition: theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Toolbar sx={{ flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
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
              disabled={busy || !canRevert}
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

            {currentSession?.isActive && currentRound > 0 && (
              <>
                <Button color="inherit" size="small" disabled={busy}
                  onClick={() => setOpenTool("event")}>
                  Event
                </Button>
                <Button color="inherit" size="small" disabled={busy}
                  onClick={() => setEndEarlyDialogOpen(true)}>
                  End game early
                </Button>
              </>
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
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: isOpeningScreen ? { xs: 1.5, sm: 2 } : 1,
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: primaryColor,
          display: useSidebar ? "grid" : "flex",
          flexDirection: "column",
          gridTemplateColumns: useSidebar ? "clamp(220px, 17vw, 300px) minmax(0, 1fr)" : undefined,
          alignContent: useSidebar ? "start" : undefined,
          columnGap: 1,
          alignItems: useSidebar ? "start" : undefined,
        }}
      >

        {error && openTool !== "event" && (
          <Alert severity="error" sx={{ mb: 2, gridColumn: "1 / -1" }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {!isOpeningScreen && (
          <Box sx={{
            gridColumn: 1,
            minWidth: 0,
            position: useSidebar ? "sticky" : undefined,
            top: 8,
          }}>
            <Paper sx={{ borderRadius: 1, mb: 0.5 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                orientation={useSidebar ? "vertical" : "horizontal"}
                variant={useSidebar ? "standard" : "fullWidth"}
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  "& .MuiTabs-indicator": useSidebar
                    ? { left: 0, right: "auto", width: 5, bgcolor: gameHeaderColor }
                    : undefined,
                  "& .MuiTab-root": {
                    minWidth: 0,
                    px: { xs: 0.5, sm: 2 },
                    justifyContent: useSidebar ? "flex-start" : undefined,
                  },
                }}
              >
                <Tab id="game-tab-0" aria-controls="game-tabpanel-0" icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
                <Tab id="game-tab-1" aria-controls="game-tabpanel-1" icon={<LocationCityIcon />} label="Town Details" iconPosition="start" />
                <Tab id="game-tab-2" aria-controls="game-tabpanel-2" icon={<HistoryIcon />} label="Game History" iconPosition="start" />
              </Tabs>
            </Paper>
            <StageBar
              session={currentSession}
              currentRound={currentRound}
              currentStage={currentStage}
              loading={busy}
              onStartGame={handleStartGame}
              onChangeStage={handleChangeStage}
              onOpenCards={() => setOpenTool("cards")}
              onOpenEvent={() => setOpenTool("event")}
              onSettleRound={handleSettleRound}
              onOpenSummary={() => setSummaryDialogOpen(true)}
              onUpdatePlayerCount={updatePlayerCount}
            />
          </Box>
        )}

        <Box sx={{ gridColumn: useSidebar ? 2 : undefined, minWidth: 0 }}>
          <TabPanel value={isOpeningScreen ? 0 : activeTab} index={0} compact>
            {isOpeningScreen ? (
              <Paper sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                maxWidth: 960,
                mx: "auto",
                display: "grid",
                rowGap: { xs: 2.5, sm: 3 },
              }}>
                <Typography variant="body1" color="text.secondary" align="center">
                  Manage your towns across {totalRounds} {totalRounds === 1 ? "year" : "years"} of climate hazards and adaptations.
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: { xs: 1, sm: 3 },
                    width: "100%",
                    maxWidth: 720,
                    mx: "auto",
                  }}
                >
                  {[
                    { title: "Time Machine", src: MEDIA_CONFIG.timeMachineVideo, Icon: AccessTimeIcon },
                    { title: "NESH Explainer", src: MEDIA_CONFIG.neshExplainerVideo, Icon: OndemandVideoIcon },
                  ].map(({ title, src, Icon }) => (
                    <Card variant="outlined" key={title}>
                      <CardActionArea
                        onClick={() => {
                          setVideoError(false);
                          setVideoModal({ open: true, title, src });
                        }}
                        sx={{ height: "100%", textAlign: "center" }}
                      >
                        <CardContent>
                          <Icon sx={{ fontSize: 44, color: "primary.main", mb: 1 }} />
                          <Typography fontWeight={600}>{title}</Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))}
                </Box>

                <Box>
                  <Typography component="h2" variant="subtitle1" fontWeight={600} align="center">
                    Meet the five climate hazards
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
                    {hazards.map((hazard) => (
                      <Tooltip title={hazard.name} key={hazard.id}>
                        <IconButton aria-label={hazard.name} onClick={() => setSelectedHazard(hazard)}>
                          <HazardIcon hazardId={hazard.id} size={32} />
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
                  {currentRound === 0 && (
                    <Button onClick={navigateToDashboard} startIcon={<ArrowBackIcon />}>
                      Back to game list
                    </Button>
                  )}
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
              <TownPieCharts
                towns={towns}
                currentStage={currentStage}
                chartPresentation={presentation}
                chartProgress={chartProgress}
              />
            )}
          </TabPanel>

          <TabPanel value={isOpeningScreen ? 0 : activeTab} index={1}>
            <TownDetailsView
              towns={towns}
              onUpdateTownName={handleUpdateTownName}
              disabled={!currentSession?.isActive}
            />
          </TabPanel>

          <TabPanel value={isOpeningScreen ? 0 : activeTab} index={2}>
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
      </Box>

      <Dialog
        open={!isOpeningScreen && currentStage === "adaptation" && openTool === "cards"}
        onClose={() => setOpenTool(null)}
        aria-label="Play adaptation cards"
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <IconButton aria-label="Close cards" size="small" onClick={() => setOpenTool(null)}
            sx={{ float: "right" }}>
            <CloseIcon />
          </IconButton>
          <CardControls
            towns={towns}
            onPlayCard={handlePlayCard}
            disabled={busy}
            currentRound={currentRound}
            currentStage={currentStage}
            townCardPlayDocs={townCardPlayDocs}
            onRemoveCardPlay={removeCardPlay}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!isOpeningScreen && Boolean(currentSession?.isActive) && openTool === "event"}
        onClose={() => setOpenTool(null)}
        aria-label="Climate event"
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { width: "min(760px, 94vw)", maxHeight: "94vh", borderRadius: 3 } }}
      >
        <DialogContent sx={{ p: 2.5, position: "relative" }}>
          <IconButton size="small" onClick={() => setOpenTool(null)}
            sx={{ position: "absolute", top: 10, right: 10 }} aria-label="Close hazard wheel">
            <CloseIcon />
          </IconButton>
          {error && <Alert severity="error" onClose={clearError} sx={{ mr: 4, mb: 1 }}>{error}</Alert>}
          {openTool === "event" && (
            <HazardControls
              onApplyHazard={handleApplyHazard}
              onNext={currentStage === "hazard" ? () => handleChangeStage("review") : undefined}
              disabled={busy}
              currentRound={currentRound}
              onWheelEnabledChange={(enabled) => updateDigitalWheel(sessionId, enabled)}
              digitalWheelEnabled={currentSession?.digitalWheelEnabled ?? true}
              hazardCountThisRound={hazardCountThisRound}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={presentation?.phase === "playing"}
        onClose={(_, reason) => {
          if (reason !== "backdropClick") {
            setChartPresentation({ ...presentation, phase: "closing" });
          }
        }}
        slotProps={{
          transition: {
            onExited: () => setChartPresentation((current) => current?.phase === "closing"
              ? { ...current, phase: "animating" }
              : current),
          },
        }}
        maxWidth="md"
        fullWidth
        aria-labelledby="hazard-animation-title"
      >
        <HazardDialogTitle
          id="hazard-animation-title"
          hazard={announcedHazard}
          closeLabel="Close hazard animation"
          onClose={() => setChartPresentation({ ...presentation, phase: "closing" })}
        >
          {HAZARD_HEADLINES[announcedHazard?.id] || announcedHazard?.name}
        </HazardDialogTitle>
        <DialogContent>
          {announcedHazard && <HazardMedia key={announcedHazard.id} hazard={announcedHazard} sx={hazardMediaSize} />}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedHazard)}
        onClose={() => setSelectedHazard(null)}
        maxWidth="md"
        fullWidth
        aria-labelledby="hazard-icon-title"
      >
        <HazardDialogTitle
          id="hazard-icon-title"
          hazard={selectedHazard}
          closeLabel="Close hazard icon"
          onClose={() => setSelectedHazard(null)}
        >
          {selectedHazard?.name}
        </HazardDialogTitle>
        <DialogContent>
          <Box sx={{ ...hazardMediaSize, display: "grid", placeItems: "center" }}>
            {selectedHazard && (
              <HazardIcon
                hazardId={selectedHazard.id}
                sx={{ width: "min(75%, 50vh, 360px)", height: "auto", aspectRatio: "1" }}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Video player */}
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
              This video could not be loaded. Please try again later. You can close this window and continue the workshop.
            </Alert>
          ) : (
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <video
                key={videoModal.src}
                src={videoModal.src}
                controls
                autoPlay
                playsInline
                preload="metadata"
                aria-label={videoModal.title}
                onError={() => setVideoError(true)}
                style={{ display: "block", width: "100%", maxHeight: "65vh", objectFit: "contain", background: "#111", borderRadius: 8 }}
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
