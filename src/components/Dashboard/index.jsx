// src/components/Dashboard/index.jsx
// Modified Dashboard to include completed sessions without tabs

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useGame } from "../../contexts/GameContext";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
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
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { primaryColor } from "../../constants/palette";
import backgroundImage from "../../assets/images/web-banner.png";

import DownloadIcon from "@mui/icons-material/Download";
import exportService from "../../services/exportService";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const {
    loading,
    error,
    activeSessions,
    completedSessions, // We'll use this now
    fetchUserSessions,
    createNewSession,
    deleteSession,
    clearError,
  } = useGame();

  const navigate = useNavigate();

  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [downloadMenu, setDownloadMenu] = useState({
    open: false,
    anchorEl: null,
    sessionId: null,
  });
  const [isExporting, setIsExporting] = useState(false);

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
  async function handleCreateGame() {
    setIsCreating(true);
    try {
      const session = await createNewSession();
      if (session) {
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

  const handleDownloadMenuOpen = (event, sessionId) => {
    setDownloadMenu({ open: true, anchorEl: event.currentTarget, sessionId });
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenu({ open: false, anchorEl: null, sessionId: null });
  };

  // Download functions
  const handleDownloadJSON = async () => {
    try {
      const sessionId = downloadMenu.sessionId;
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
      handleDownloadMenuClose();
    } catch (error) {
      console.error("Error downloading JSON:", error);
      // Use the existing error handling mechanism
      clearError();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const sessionId = downloadMenu.sessionId;
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
      handleDownloadMenuClose();
    } catch (error) {
      console.error("Error downloading Excel:", error);
      // Use the existing error handling mechanism
      clearError();
    } finally {
      setIsExporting(false);
    }
  };

  // Combine sessions for display
  const allSessions = [...activeSessions, ...completedSessions];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="relative"
        sx={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "300px", // Adjust height to match your banner's proportions
          display: "flex",
        }}
      ></AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <AccountCircleIcon
                  sx={{ fontSize: 80, color: "primary.main" }}
                />
              </Box>
              <Typography
                variant="h6"
                gutterBottom
                component="div"
                align="center"
              >
                User Profile
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" gutterBottom>
                <strong>Email:</strong> {currentUser.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>User ID:</strong> {currentUser.uid}
              </Typography>
              <Button
                color="primary"
                variant="contained"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ textShadow: "1px 1px 2px rgba(0,0,0,0.7)" }}
              >
                Logout
              </Button>
            </Paper>
          </Grid>

          {/* Game Sessions */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                minHeight: 240,
                minWidth: 300,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h5">Game Sessions</Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 2, ml: 2 }}
                  >
                    {activeSessions.length}/3 active games
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateGame}
                    disabled={isCreating || activeSessions.length >= 3}
                  >
                    {isCreating
                      ? "Creating..."
                      : activeSessions.length >= 3
                      ? "Limit Reached"
                      : "New Game"}
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : allSessions.length === 0 ? (
                <Typography variant="body1" sx={{ p: 2, textAlign: "center" }}>
                  No game sessions found. Create a new game to start!
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {allSessions.map((session) => (
                    <Grid item xs={12} sm={6} key={session.id}>
                      <Card>
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography variant="h6">
                              {session.name || "Untitled Game"}
                            </Typography>
                            {!session.isActive && (
                              <Chip
                                label="Completed"
                                color="success"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            <strong>Created:</strong>{" "}
                            {formatDate(session.createdAt)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            <strong>Current Round:</strong>{" "}
                            {session.currentRound}
                          </Typography>
                          {!session.isActive && session.completedAt && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              <strong>Completed:</strong>{" "}
                              {formatDate(session.completedAt)}
                            </Typography>
                          )}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mt: 2,
                            }}
                          >
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={
                                session.isActive ? (
                                  <PlayArrowIcon />
                                ) : (
                                  <VisibilityIcon />
                                )
                              }
                              sx={{ mr: 1 }}
                              onClick={() => handleStartGame(session.id)}
                            >
                              {session.isActive ? "Continue" : "View"}
                            </Button>
                            <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<DownloadIcon />}
                              onClick={(e) =>
                                handleDownloadMenuOpen(e, session.id)
                              }
                              sx={{ mr: 1 }}
                              disabled={isExporting}
                            >
                              {isExporting &&
                              downloadMenu.sessionId === session.id
                                ? "Exporting..."
                                : "Export"}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => openDeleteDialog(session)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

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
        anchorEl={downloadMenu.anchorEl}
        open={downloadMenu.open}
        onClose={handleDownloadMenuClose}
      >
        <MenuItem onClick={handleDownloadJSON} disabled={isExporting}>
          Download as JSON
        </MenuItem>
        <MenuItem onClick={handleDownloadExcel} disabled={isExporting}>
          Download as Excel
        </MenuItem>
      </Menu>
    </Box>
  );
}
