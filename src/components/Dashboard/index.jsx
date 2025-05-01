import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
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
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import StandardButton from "../ui/StandardButton";
import { primaryColor } from "../../constants/palette";
import StandardIconButton from "../ui/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Dashboard() {
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for dialog visibility
  const [selectedSession, setSelectedSession] = useState(null); // State for the selected session
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setError("");

    try {
      await logout();
      navigate("/login");
    } catch {
      setError("Failed to log out");
    }
  }

  async function handleStartGame() {
    setError("");

    try {
      navigate("/game");
      console.log("Game session initialized successfully.");
    } catch (error) {
      setError("Failed to initialize game session");
    }
  }

  async function handleDeleteGameSession() {
    setError("");

    try {
      // Call your game session deletion function here
      console.log(`Game session ${selectedSession} deleted successfully.`);
      setIsDialogOpen(false); // Close the dialog after deletion
    } catch (error) {
      setError("Failed to delete game session");
    }
  }

  function openDeleteDialog(sessionId) {
    setSelectedSession(sessionId); // Set the session to be deleted
    setIsDialogOpen(true); // Open the dialog
  }

  function closeDeleteDialog() {
    setIsDialogOpen(false); // Close the dialog
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My App
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
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

          {/* Main Content */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                minHeight: 240,
              }}
            >
              <Typography variant="h5" gutterBottom>
                Game Sessions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Grid
                        container
                        spacing={2}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body2">Game Session 1</Typography>
                        <StandardButton
                          color={primaryColor}
                          text="Start Game"
                          size="large"
                          onClick={handleStartGame}
                        >
                          Start
                        </StandardButton>
                        <StandardIconButton
                          onClick={() => openDeleteDialog("Game Session 1")}
                          icon={<DeleteIcon />}
                          color={"#FF3B53"}
                          size="large"
                        />
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Grid
                        container
                        spacing={2}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body2">Game Session 2</Typography>
                        <StandardButton
                          color={primaryColor}
                          text="Start Game"
                          size="large"
                          onClick={handleStartGame}
                        >
                          Start
                        </StandardButton>
                        <StandardIconButton
                          onClick={() => openDeleteDialog("Game Session 2")}
                          icon={<DeleteIcon />}
                          color={"#FF3B53"}
                          size="large"
                        />
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedSession}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <StandardButton
            onClick={closeDeleteDialog}
            color="primary"
            size={"small"}
          >
            Cancel
          </StandardButton>
          <StandardButton
            onClick={handleDeleteGameSession}
            color="error"
            size={"small"}
          >
            Delete
          </StandardButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
