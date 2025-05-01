import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import { useAuth } from "./contexts/AuthContext";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  primaryColor,
  primaryColorLight,
  secondaryColor,
} from "./constants/palette";
import Contexts from "./contexts";
import Game from "./components/Game";
import LayoutTemplate from "./components/Template";

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
      default: secondaryColor,
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    fontSize: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: primaryColor,
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
  },
});

// Protected route component
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Contexts>
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/game"
              element={
                <PrivateRoute>
                  <LayoutTemplate>
                    <Game />
                  </LayoutTemplate>
                </PrivateRoute>
              }
            />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </Contexts>
      </Router>
    </ThemeProvider>
  );
}

export default App;
