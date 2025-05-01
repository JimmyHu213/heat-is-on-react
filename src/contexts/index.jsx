import { AuthProvider } from "./AuthContext";
import { SettingsProvider } from "./SettingsContext";
import { GameProvider } from "./GameContext";

/**
 * Combined context providers for the application
 * Properly nested to ensure dependencies are available
 */
export default function AppContextProvider({ children }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <GameProvider>{children}</GameProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
