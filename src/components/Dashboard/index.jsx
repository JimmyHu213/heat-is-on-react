// src/components/Dashboard/index.jsx
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
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import { primaryColor } from "../../constants/palette";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const {
    loading,
    error,
    activeSessions,
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            The Heat Is On
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

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
                height: 240,
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
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateGame}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "New Game"}
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : activeSessions.length === 0 ? (
                <Typography variant="body1" sx={{ p: 2, textAlign: "center" }}>
                  No active game sessions. Create a new game to start!
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {activeSessions.map((session) => (
                    <Grid item xs={12} sm={6} key={session.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Game Session
                          </Typography>
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
                              startIcon={<PlayArrowIcon />}
                              onClick={() => handleStartGame(session.id)}
                            >
                              Continue
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
    </Box>
  );
}
