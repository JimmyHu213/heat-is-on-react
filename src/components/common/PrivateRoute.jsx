import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { CircularProgress, Box } from "@mui/material";

/**
 * PrivateRoute component
 * Protects routes that require authentication
 * Redirects to login if not authenticated
 */
export default function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Render the protected route if authenticated
  return children;
}
