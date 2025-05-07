// src/contexts/index.jsx
import React from "react";
import { AuthProvider } from "./AuthContext";
import { GameProvider } from "./GameContext";

/**
 * Combined context providers for the application
 * Wraps all providers in the correct order
 */
export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <GameProvider>{children}</GameProvider>
    </AuthProvider>
  );
}
