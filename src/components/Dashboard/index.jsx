// src/components/Dashboard/index.jsx
// Modified to include editable session names

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useGame } from "../../contexts/GameContext";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Stack,
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Button,
  Chip,
  TextField,
  IconButton,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import backgroundImage from "../../assets/images/web-banner.png";

import exportService from "../../services/exportService";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import NewGameDialog from "./NewGameDialog";
import TrainingLink from "../common/TrainingLink";
import { getPlayerCount, getTotalRounds } from "../../game/options";

const STAGE_LABELS = {
  setup: "Setup",
  adaptation: "Adapt",
  hazard: "Event",
  review: "Review",
  complete: "Completed",
};

export default function Dashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const {
    loading,
    error,
    activeSessions,
    completedSessions,
    fetchUserSessions,
    createNewSession,
    updateSessionName, // Added this function
    deleteSession,
    clearError,
  } = useGame();

  const navigate = useNavigate();

  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewGameDialogOpen, setIsNewGameDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sessionMenu, setSessionMenu] = useState({
    open: false,
    anchorEl: null,
    sessionId: null,
  });
  const [isExporting, setIsExporting] = useState(false);

  // New state for editing session names
  const [editSession, setEditSession] = useState({
    id: null,
    name: "",
    isEditing: false,
  });

  // Fetch sessions on component mount
  useEffect(() => {
    fetchUserSessions();
  }, []);

  // Handle logout
  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // Handle start game
  async function handleStartGame(sessionId) {
    navigate(`/game/${sessionId}`);
  }

  // Handle create game
  async function handleCreateGame(name, options) {
    setIsCreating(true);
    try {
      const session = await createNewSession(name, options);
      if (session) {
        setIsNewGameDialogOpen(false);
        navigate(`/game/${session.id}`);
      }
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsCreating(false);
    }
  }

  // Handle delete session
  async function handleDeleteSession() {
    if (!selectedSession) return;

    try {
      await deleteSession(selectedSession.id);
      setIsDialogOpen(false);
      setSelectedSession(null);
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }

  // Open delete dialog
  function openDeleteDialog(session) {
    setSelectedSession(session);
    setIsDialogOpen(true);
  }

  // Close delete dialog
  function closeDeleteDialog() {
    setIsDialogOpen(false);
    setSelectedSession(null);
  }

  // Format date
  function formatDate(timestamp) {
    if (!timestamp) return "N/A";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  const handleSessionMenuOpen = (event, sessionId) => {
    setSessionMenu({ open: true, anchorEl: event.currentTarget, sessionId });
  };

  const handleSessionMenuClose = () => {
    setSessionMenu({ open: false, anchorEl: null, sessionId: null });
  };

  // Download functions
  const handleDownloadJSON = async () => {
    try {
      const sessionId = sessionMenu.sessionId;
      if (!sessionId) return;

      // Show loading state
      setIsExporting(true);

      // Get data package
      const data = await exportService.getSessionDataPackage(sessionId);

      // Get session name for filename
      const session = [...activeSessions, ...completedSessions].find(
        (s) => s.id === sessionId
      );
      const sessionName = (session?.name || "game-session")
        .replace(/\s+/g, "-")
        .toLowerCase();

      // Download as JSON
      exportService.downloadAsJSON(data, `${sessionName}-data.json`);

      // Close menu
      handleSessionMenuClose();
    } catch (error) {
      console.error("Error downloading JSON:", error);
      clearError();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const sessionId = sessionMenu.sessionId;
      if (!sessionId) return;

      // Show loading state
      setIsExporting(true);

      // Get data package
      const data = await exportService.getSessionDataPackage(sessionId);

      // Get session name for filename
      const session = [...activeSessions, ...completedSessions].find(
        (s) => s.id === sessionId
      );
      const sessionName = (session?.name || "game-session")
        .replace(/\s+/g, "-")
        .toLowerCase();

      // Download as Excel
      await exportService.downloadAsExcel(data, `${sessionName}-data.xlsx`);

      // Close menu
      handleSessionMenuClose();
    } catch (error) {
      console.error("Error downloading Excel:", error);
      clearError();
    } finally {
      setIsExporting(false);
    }
  };

  // NEW FUNCTIONS FOR EDITING SESSION NAMES

  // Start editing a session name
  const handleStartEdit = (session, e) => {
    // Prevent event from propagating to parent (which might navigate to game)
    if (e) e.stopPropagation();

    setEditSession({
      id: session.id,
      name: session.name || "Untitled Game",
      isEditing: true,
    });
  };

  // Handle changes to the session name input
  const handleNameChange = (e) => {
    setEditSession({
      ...editSession,
      name: e.target.value,
    });
  };

  // Save the edited session name
  const handleSaveSessionName = async (e) => {
    if (e) e.stopPropagation();

    if (!editSession.id || !editSession.name.trim()) {
      // Reset editing state if name is empty
      setEditSession({ id: null, name: "", isEditing: false });
      return;
    }

    try {
      await updateSessionName(editSession.id, editSession.name.trim());
      setEditSession({ id: null, name: "", isEditing: false });
    } catch (error) {
      console.error("Failed to update session name:", error);
    }
  };

  // Cancel editing
  const handleCancelEdit = (e) => {
    if (e) e.stopPropagation();
    setEditSession({ id: null, name: "", isEditing: false });
  };

  const menuSession = [...activeSessions, ...completedSessions].find(
    (session) => session.id === sessionMenu.sessionId
  );
  const displayName = userProfile?.displayName || currentUser.displayName || "Your account";
  const avatar = userProfile?.photoURL ?? currentUser.photoURL;

  function renderGame(session) {
    const editing = editSession.id === session.id && editSession.isEditing;
    const status = session.isActive
      ? (session.currentRound === 0 ? "Setup" : STAGE_LABELS[session.stage] || "Adapt")
      : session.endedEarly ? "Ended early" : "Completed";
    const date = session.completedAt ?? session.createdAt;
    const players = getPlayerCount(session);

    return (
      <Box component="li" key={session.id} sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(0, 1fr) auto" },
        gap: 1.5, alignItems: "center", py: 2, borderTop: "1px solid #dce5df",
      }}>
        <Box sx={{ minWidth: 0 }}>
          {editing ? (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TextField fullWidth autoFocus size="small" label="Game name" value={editSession.name}
                onChange={handleNameChange} slotProps={{ htmlInput: { maxLength: 50 } }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSaveSessionName(event);
                  if (event.key === "Escape") handleCancelEdit(event);
                }} />
              <IconButton aria-label="Save game name" onClick={handleSaveSessionName}><CheckIcon /></IconButton>
              <IconButton aria-label="Cancel rename" onClick={handleCancelEdit}><CloseIcon /></IconButton>
            </Stack>
          ) : (
            <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
              <Typography component="h3" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>
                {session.name || "Untitled Game"}
              </Typography>
              <Chip size="small" variant="outlined" label={status} />
            </Stack>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {[
              session.isActive && session.currentRound > 0
                ? "Round " + session.currentRound + " of " + getTotalRounds(session)
                : !session.isActive
                  ? Math.max(0, (session.currentRound ?? 1) - 1) + " of " + getTotalRounds(session) + " rounds played"
                  : null,
              date ? formatDate(date) : null,
              players === null ? null : players + " players",
            ].filter(Boolean).join(" · ")}
          </Typography>
        </Box>
        <Stack direction="row" gap={0.5}>
          <Button variant={session.isActive ? "contained" : "outlined"}
            startIcon={session.isActive ? <PlayArrowIcon /> : <VisibilityIcon />}
            onClick={() => handleStartGame(session.id)}
            sx={session.isActive ? { bgcolor: "#245956" } : { color: "#245956" }}>
            {session.isActive ? "Continue" : "View"}
          </Button>
          <IconButton aria-label={"Actions for " + (session.name || "Untitled Game")} aria-haspopup="menu"
            onClick={(event) => handleSessionMenuOpen(event, session.id)}>
            <MoreHorizIcon />
          </IconButton>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
      <AppBar
        position="relative"
        sx={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "300px",
          display: "flex",
        }}
      ></AppBar>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f6f8f5", color: "#172e2c" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{error}</Alert>}
          <Box sx={{
            display: "grid", gap: 3, alignItems: "start",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(245px, 0.38fr)" },
          }}>
            <Paper component="section" aria-labelledby="dashboard-games" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" gap={2} flexWrap="wrap" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                  <Typography id="dashboard-games" component="h1" variant="h4" fontWeight={700}>Your games</Typography>
                  <Typography variant="body2" color="text.secondary">{activeSessions.length} of 3 active games</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: "#245956" }}
                  onClick={() => setIsNewGameDialogOpen(true)} disabled={isCreating || activeSessions.length >= 3}>
                  {isCreating ? "Creating…" : activeSessions.length >= 3 ? "Limit reached" : "New game"}
                </Button>
              </Stack>
              {loading ? <CircularProgress aria-label="Loading games" size={28} /> : (
                <>
                  <Typography component="h2" variant="h6" fontWeight={600} sx={{ mb: 1 }}>In progress</Typography>
                  {activeSessions.length ? (
                    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>{activeSessions.map(renderGame)}</Box>
                  ) : <Typography color="text.secondary">No games in progress.</Typography>}
                  <Typography component="h2" variant="h6" fontWeight={600} sx={{ mt: 3, mb: 1 }}>Finished games</Typography>
                  {completedSessions.length ? (
                    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>{completedSessions.map(renderGame)}</Box>
                  ) : <Typography color="text.secondary">No finished games yet.</Typography>}
                </>
              )}
            </Paper>
            <Paper component="aside" aria-label="Account" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={avatar || undefined} sx={{ bgcolor: "#245956" }}>
                    {(userProfile?.displayName || currentUser.displayName || currentUser.email || "?").charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <Typography component="h2" fontWeight={700}>{displayName}</Typography>
                    <Typography variant="body2" color="text.secondary">{userProfile?.email || currentUser.email}</Typography>
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  User ID: {currentUser.uid}
                </Typography>
                <Divider />
                <Button variant="outlined" onClick={() => navigate("/account")} sx={{ color: "#245956" }}>Manage account</Button>
                <TrainingLink fullWidth />
                <Button onClick={handleLogout} startIcon={<LogoutIcon />} sx={{ color: "#245956" }}>Sign out</Button>
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this game session? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteSession} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={sessionMenu.anchorEl}
        open={sessionMenu.open}
        onClose={handleSessionMenuClose}
      >
        <MenuItem disabled={!menuSession} onClick={() => {
          handleSessionMenuClose();
          handleStartEdit(menuSession);
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Rename
        </MenuItem>
        <MenuItem onClick={handleDownloadJSON} disabled={isExporting}>
          Download as JSON
        </MenuItem>
        <MenuItem onClick={handleDownloadExcel} disabled={isExporting}>
          Download as Excel
        </MenuItem>
        <MenuItem disabled={!menuSession} onClick={() => {
          handleSessionMenuClose();
          openDeleteDialog(menuSession);
        }} sx={{ color: "error.main" }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <NewGameDialog
        open={isNewGameDialogOpen}
        onClose={() => setIsNewGameDialogOpen(false)}
        onCreate={handleCreateGame}
        loading={isCreating}
      />
    </Box>
  );
}
