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
import { PresentationProvider } from "./contexts/PresentationContext";
import AppProviders from "./contexts";

// Components
import Dashboard from "./components/Dashboard";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword";
import Game from "./components/Game";
import PrivateRoute from "./components/common/PrivateRoute";
import Footer from "./components/common/Footer";
import { Box } from "@mui/material";
import LanguageSwitcher from "./components/common/LanguageSwitcher";
import { useLanguage } from "./i18n";

// Create a Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: primaryColor,
      light: primaryColorLight,
    },
    secondary: {
      main: "#c56e50",
    },
    background: {
      default: "#f3f7f5",
      paper: "#fff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #dce7e1",
          boxShadow: "0 8px 24px rgba(28,61,51,0.06)",
        },
      },
    },
  },
});

function App() {
  // Re-render the presentation tree on a language change, preserving game state.
  useLanguage();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <PresentationProvider>
        <AppProviders>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh", // This ensures the footer sticks to the bottom
            }}
          >
            <LanguageSwitcher />
            <Routes>
              {/* Your existing routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Add Footer here */}
            <Footer />
          </Box>
        </AppProviders>
        </PresentationProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
