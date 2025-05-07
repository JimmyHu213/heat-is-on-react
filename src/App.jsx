// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  primaryColor,
  primaryColorLight,
  secondaryColor,
} from "./constants/palette";

// Context Providers
import AppProviders from "./contexts";

// Components
import Dashboard from "./components/Dashboard";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword";
import Game from "./components/Game";
import PrivateRoute from "./components/common/PrivateRoute";

// Create a Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: primaryColor,
      light: primaryColorLight,
    },
    secondary: {
      main: secondaryColor,
    },
    background: {
      default: primaryColor,
      paper: "#fff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppProviders>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/game/:sessionId"
              element={
                <PrivateRoute>
                  <Game />
                </PrivateRoute>
              }
            />

            {/* Redirect any unknown routes to the dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProviders>
      </Router>
    </ThemeProvider>
  );
}

export default App;
