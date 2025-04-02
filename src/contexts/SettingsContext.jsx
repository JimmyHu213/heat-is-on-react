import { createContext, useContext } from "react";
import { useEffect, useState } from "react";
import {
  initializeGameSettings,
  getGameSettings,
} from "../services/gameSettingSerivce";

const SettingContext = createContext();

export function SettingProvider({ children }) {
  const [settings, setSettings] = useState(true); // Example state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const initialSettings = await getGameSettings();
        if (!initialSettings) {
          await initializeGameSettings();
        }
        setSettings(true);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const value = {
    settings,
  };
  console.log("settings", settings);

  return (
    <SettingContext.Provider value={value}>{children}</SettingContext.Provider>
  );
}

export function useSetting() {
  return useContext(SettingContext);
}
