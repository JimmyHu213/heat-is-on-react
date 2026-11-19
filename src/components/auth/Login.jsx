import { MEDIA_CONFIG } from "../../constants/mediaConfig";
// src/components/auth/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import "./Login.css";

/**
 * Login component for user authentication
 */
const Login = () => {
  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Hooks
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // Attempt login
      await login(email, password);

      // Navigate to dashboard on success
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      // More specific error messages based on error code
      if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please check your credentials.");
      } else if (error.code === "auth/user-disabled") {
        setError("This account has been disabled. Please contact support.");
      } else if (error.code === "auth/user-not-found") {
        setError(
          "No account found with this email. Please check your email or sign up."
        );
      } else {
        setError("Failed to log in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <header className="login-hero">
        <img src={MEDIA_CONFIG.loginCover} alt="Illustrated map of Adaptania" />
        <div className="login-hero-copy">
          <h1>THE HEAT IS ON</h1>
          <p>Help your town adapt to a changing climate.</p>
        </div>
      </header>
      <section className="login-panel" aria-labelledby="login-heading">
        <div className="login-panel-content">
          <Typography id="login-heading" component="h2" variant="h4" fontWeight={700}>
            Sign in
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: "100%" }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 2, width: "100%" }}
          >
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 2, minHeight: 48, bgcolor: "#245956", "&:hover": { bgcolor: "#194542" } }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign in"
              )}
            </Button>

            <Stack direction="row" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Link to="/forgot-password">Forgot password?</Link>
              <Link to="/signup">Create an account</Link>
            </Stack>

          </Box>
        </div>
      </section>
    </main>
  );
};

export default Login;
