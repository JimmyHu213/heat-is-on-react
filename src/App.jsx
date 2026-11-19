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
import Account from "./components/Account";
import CcsAccess from "./components/auth/CcsAccess";
import { ccsOnly } from "./contexts/ccsSession";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword";
import Game from "./components/Game";
import PrivateRoute from "./components/common/PrivateRoute";
import Footer from "./components/common/Footer";
import { Box } from "@mui/material";

// Create a Material UI theme
const heading = { fontFamily: "Fredoka, sans-serif", fontWeight: 600 };
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
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    fontFamily: '"Figtree", "Helvetica", "Arial", sans-serif',
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

function App({ handoffUid }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppProviders>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh", // This ensures the footer sticks to the bottom
            }}
          >
            <Routes>
              <Route path="/auth" element={<CcsAccess handoffUid={handoffUid} />} />
              <Route path="/login" element={ccsOnly ? <CcsAccess /> : <Login />} />
              <Route path="/signup" element={ccsOnly ? <CcsAccess /> : <Signup />} />
              <Route path="/forgot-password" element={ccsOnly ? <CcsAccess /> : <ForgotPassword />} />
              <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
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
      </Router>
    </ThemeProvider>
  );
}

export default App;
