import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
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
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function Dashboard() {
  const [error, setError] = useState("");
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
                Dashboard
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                Welcome to your dashboard! This is where your main application
                content will go.
              </Typography>
              <Box sx={{ flexGrow: 1, mt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Card Title 1
                        </Typography>
                        <Typography variant="body2">
                          This is a sample card where you can display
                          information from your application. Replace this with
                          actual content from your Firebase data.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Card Title 2
                        </Typography>
                        <Typography variant="body2">
                          This is another sample card where you can display
                          information from your application. Replace this with
                          actual content from your Firebase data.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
