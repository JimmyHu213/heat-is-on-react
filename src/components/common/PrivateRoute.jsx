// src/components/common/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { ccsOnly } from "../../contexts/ccsSession";
import { useAuth } from "../../contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";

/**
 * PrivateRoute component to protect routes that require authentication
 */
const PrivateRoute = ({ children }) => {
  const { currentUser, loading, expired, deadline } = useAuth();

  // Show loading while checking authentication
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

  // If not authenticated, redirect to login
  if (expired || (currentUser && Date.now() >= deadline)) return <Navigate to="/auth" replace />;
  if (!currentUser) {
    return <Navigate to={ccsOnly ? "/auth" : "/login"} replace />;
  }

  // If authenticated, render the protected route
  return children;
};

export default PrivateRoute;
