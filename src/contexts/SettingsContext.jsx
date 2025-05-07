import { createContext, useContext, useState, useEffect } from "react";
import {
  initializeGameSettings,
  getGameSettings,
  getTownTemplates,
  getCards,
  getHazards,
} from "../services/gameSettingsService";

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Game settings
  const [settings, setSettings] = useState(null);
  const [townTemplates, setTownTemplates] = useState([]);
  const [cards, setCards] = useState([]);
  const [hazards, setHazards] = useState([]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Load all game settings
  const loadSettings = async () => {
    setLoading(true);
    try {
      // Get game settings
      let gameSettings = await getGameSettings();

      // If settings don't exist, initialize them
      if (!gameSettings) {
        await initializeGameSettings();
        gameSettings = await getGameSettings();
      }

      setSettings(gameSettings);

      // Load town templates, cards, and hazards
      const [templates, allCards, allHazards] = await Promise.all([
        getTownTemplates(),
        getCards(),
        getHazards(),
      ]);

      setTownTemplates(templates);
      setCards(allCards);
      setHazards(allHazards);

      setError(null);
    } catch (err) {
      console.error("Error loading game settings:", err);
      setError("Failed to load game settings. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Group cards by type
  const getCardsByType = (type) => {
    return cards.filter((card) => card.type === type);
  };

  // Group cards by round
  const getCardsByRound = (round) => {
    return cards.filter((card) => card.round === round);
  };

  // Get a town template by ID
  const getTownTemplateById = (templateId) => {
    return townTemplates.find(
      (template) => template.townTemplateId === templateId
    );
  };

  // Get a card by ID
  const getCardById = (cardId) => {
    return cards.find((card) => card.cardId === cardId);
  };

  // Get a hazard by ID
  const getHazardById = (hazardId) => {
    return hazards.find((hazard) => hazard.hazardId === hazardId);
  };

  const value = {
    // State
    loading,
    error,
    settings,
    townTemplates,
    cards,
    hazards,

    // Getters
    getCardsByType,
    getCardsByRound,
    getTownTemplateById,
    getCardById,
    getHazardById,

    // Actions
    loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {!loading && children}
    </SettingsContext.Provider>
  );
}
