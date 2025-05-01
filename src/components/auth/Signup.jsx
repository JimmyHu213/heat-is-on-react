// src/components/auth/Signup.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { primaryColorLight } from "../../constants/palette";

/**
 * Signup component for user registration
 */
const Signup = () => {
  // State
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Hooks
  const { signup } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!displayName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // Create user with additional display name
      await signup(email, password, { displayName });

      // Show success message and redirect after delay
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Signup error:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/email-already-in-use") {
        setError("Email address is already in use");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError("Failed to create an account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: primaryColorLight }}>
            <PersonAddIcon />
          </Avatar>

          <Typography component="h1" variant="h5">
            Sign Up
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: "100%" }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2, width: "100%" }}>
              Account created successfully! Redirecting...
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="displayName"
              label="Display Name"
              name="displayName"
              autoComplete="name"
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              helperText="Password must be at least 6 characters long"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign Up"
              )}
            </Button>

            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link to="/login" style={{ textDecoration: "none" }}>
                  <Typography variant="body2" color="primary">
                    Already have an account? Sign in
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup;
