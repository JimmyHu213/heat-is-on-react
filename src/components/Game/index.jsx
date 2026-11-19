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
  Fab,
} from "@mui/material";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import UndoIcon from "@mui/icons-material/Undo";
import DoneIcon from "@mui/icons-material/Done";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import HistoryIcon from "@mui/icons-material/History";
import AssessmentIcon from "@mui/icons-material/Assessment";
import HomeIcon from "@mui/icons-material/Home";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StyleIcon from "@mui/icons-material/Style";
import CasinoIcon from "@mui/icons-material/Casino";
import CloseIcon from "@mui/icons-material/Close";

// Components
import TownPieCharts from "./components/TownPieCharts";
import HazardIcon from "../common/HazardIcon";
import workshopBanner from "../../assets/images/web-banner.png";
import GameTable from "./components/GameTable";
import TownDetailsView from "./components/TownDetailsView";
import HazardControls from "./components/HazardControls";
import CardControls from "./components/CardControls";
import StageBar from "./components/StageBar";
import DividendsDialog from "./components/DividendsDialog";
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
    clearError,
    updateTown,
    revertToPreviousState,
    canRevert,
  } = useGame();

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
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [hazardAnnouncement, setHazardAnnouncement] = useState(null);
  const [hazardProgress, setHazardProgress] = useState(0);

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

  const presentation = hazardAnnouncement
    && currentStage === "hazard"
    && hazardAnnouncement.sessionId === sessionId
    && hazardAnnouncement.round === currentRound
    ? hazardAnnouncement
    : null;

  useEffect(() => {
    if (presentation?.phase !== "animating") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHazardAnnouncement(null);
      return;
    }

    const startedAt = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / 1200);
      if (progress >= 1) {
        setHazardAnnouncement(null);
        return;
      }
      setHazardProgress(1 - (1 - progress) ** 2);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [presentation]);

  const totalRounds = currentSession ? getTotalRounds(currentSession) : 5;
  const hazardCountThisRound = (roundEvents[currentRound] || []).length;
  const announcedHazard = hazards.find((hazard) => hazard.id === presentation?.hazardId);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setFloatingControlsOpen(false);
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
      setHazardAnnouncement(null);
      showNotification("Reverted last move in this round", "success");
    }
  };

  const handleApplyHazard = async (hazardId) => {
    if (presentation) return;
    const pending = { sessionId, round: currentRound, hazardId, before: towns, phase: "saving" };
    setHazardProgress(0);
    setHazardAnnouncement(pending);

    const result = await applyHazard(hazardId);
    if (result) {
      setFloatingControlsOpen(false);
      setActiveTab(0);
      showNotification("Applied hazard to all towns", "warning");
    }
    setHazardAnnouncement((current) => current !== pending ? current : result
      ? { ...pending, after: result.towns, phase: "playing" }
      : null);
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

  const isOpeningScreen = currentRound === 0 || showOpeningScreen;
  const useSidebar = wideScreen && !isOpeningScreen;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isOpeningScreen ? "column" : "row",
        flex: isOpeningScreen ? 1 : undefined,
        minHeight: isOpeningScreen ? undefined : "100vh",
      }}
    >
      {isOpeningScreen && (
        <Box component="header" sx={{ lineHeight: 0 }}>
          <Box component="h1" sx={{ m: 0 }}>
            <Box
              component="img"
              src={workshopBanner}
              alt="THE HEAT IS ON"
              width={1920}
              height={300}
              sx={{ display: "block", width: "100%", height: "auto" }}
            />
          </Box>
        </Box>
      )}

      {/* App Bar */}
      {!isOpeningScreen && (
        <AppBar
          position="absolute"
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
          <Toolbar>
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
        {!isOpeningScreen && <Toolbar sx={{ gridColumn: "1 / -1" }} />}

        {error && (
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
              hazardCountThisRound={hazardCountThisRound}
              loading={loading}
              vertical={useSidebar}
              onStartGame={handleStartGame}
              onChangeStage={handleChangeStage}
              onOpenDividends={() => setDividendsDialogOpen(true)}
              onOpenEndEarly={() => setEndEarlyDialogOpen(true)}
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
                hazardPresentation={presentation}
                hazardProgress={hazardProgress}
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

      {!isOpeningScreen && (
        <>
          {/* Floating expandable stage controls panel (non-hazard stages) */}
          {floatingControlsOpen && currentStage !== "hazard" && (
            <Paper
              elevation={8}
              sx={{
                position: "fixed",
                bottom: 88,
                left: { xs: 16, sm: 24 },
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

          {/* Large centered Hazard Wheel modal (no scrollbars) */}
          <Dialog
            open={floatingControlsOpen && currentStage === "hazard"}
            onClose={() => setFloatingControlsOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                width: "min(760px, 94vw)",
                maxHeight: "94vh",
                overflow: "hidden",
                borderRadius: 3,
              },
            }}
          >
            <DialogContent sx={{ p: 2.5, overflow: "hidden", position: "relative" }}>
              <IconButton
                size="small"
                onClick={() => setFloatingControlsOpen(false)}
                sx={{ position: "absolute", top: 10, right: 10 }}
                aria-label="Close hazard wheel"
              >
                <CloseIcon />
              </IconButton>
              <HazardControls
                onApplyHazard={handleApplyHazard}
                disabled={loading || Boolean(presentation) || !currentSession?.isActive}
                currentRound={currentRound}
                currentStage={currentStage}
                digitalWheelEnabled={currentSession?.digitalWheelEnabled ?? true}
                hazardCountThisRound={hazardCountThisRound}
              />
            </DialogContent>
          </Dialog>

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
              left: { xs: 16, sm: 24 },
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
              ? currentSession?.digitalWheelEnabled === false ? "Select Hazard" : "Hazard Wheel"
              : currentStage === "review"
              ? "Reward for effort"
              : "Summary"}
          </Fab>
        </>
      )}

      <Dialog
        open={presentation?.phase === "playing"}
        onClose={(_, reason) => {
          if (reason !== "backdropClick") {
            setHazardAnnouncement({ ...presentation, phase: "closing" });
          }
        }}
        slotProps={{
          transition: {
            onExited: () => setHazardAnnouncement((current) => current?.phase === "closing"
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
          onClose={() => setHazardAnnouncement({ ...presentation, phase: "closing" })}
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
