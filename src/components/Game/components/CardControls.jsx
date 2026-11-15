// src/components/Game/components/CardControls.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  Chip,
} from "@mui/material";
import { allCards } from "../../../constants/cards";

const sortedCards = [...allCards].sort((a, b) => a.name.localeCompare(b.name));

const CardControls = ({
  towns,
  onPlayCard,
  disabled,
  currentStage = "adaptation",
  currentRound = 1,
  townCardPlayDocs = {},
  onRemoveCardPlay,
}) => {
  const [selectedTown, setSelectedTown] = useState("");
  const [selectedCard, setSelectedCard] = useState("");

  const isAdaptStage = currentStage === "adaptation";
  const controlsDisabled = disabled || !isAdaptStage;

  const handleTownChange = (event) => {
    setSelectedTown(event.target.value);
  };

  const handleCardChange = (event) => {
    setSelectedCard(event.target.value);
  };

  const handleApplyCard = () => {
    if (selectedTown && selectedCard) {
      onPlayCard(selectedTown, selectedCard);
      setSelectedCard("");
    }
  };

  const selectedCardObj = sortedCards.find((card) => card.id === selectedCard);
  const selectedTownObj = towns.find((t) => t.id === selectedTown);
  const insufficientEp =
    Boolean(selectedTownObj && selectedCardObj) &&
    selectedTownObj.effortPoints < selectedCardObj.cost;

  const currentRoundPlays = selectedTown
    ? (townCardPlayDocs[selectedTown] || []).filter(
        (play) => play.playedAtRound === currentRound
      )
    : [];

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Adapt: Play Adaptation Cards
      </Typography>

      {!isAdaptStage ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Adaptation cards can only be purchased during the <strong>Adapt</strong> stage.
        </Alert>
      ) : (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select a town and play an adaptation card. Changes apply live on the town wheels.
        </Typography>
      )}

      {/* Town Selection */}
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="town-select-label">Select Town</InputLabel>
        <Select
          labelId="town-select-label"
          id="town-select"
          value={selectedTown}
          label="Select Town"
          onChange={handleTownChange}
          disabled={controlsDisabled}
        >
          {towns
            .filter((town) => !town.isComparisonTown)
            .map((town) => (
              <MenuItem key={town.id} value={town.id}>
                {town.name} ({town.effortPoints} EP)
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {/* Unified 19-Card Selection */}
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="card-select-label">Select Adaptation Card</InputLabel>
        <Select
          labelId="card-select-label"
          id="card-select"
          value={selectedCard}
          label="Select Adaptation Card"
          onChange={handleCardChange}
          disabled={controlsDisabled || !selectedTown}
        >
          {sortedCards.map((card) => (
            <MenuItem key={card.id} value={card.id}>
              {card.type === "stormSurge"
                ? `${card.name} (storm surge · ${card.cost} EP)`
                : `${card.name} (${card.type} · ${card.cost} EP)`}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {selectedCardObj
            ? `Duration: ${selectedCardObj.duration || 1} yr · +N:${selectedCardObj.nature ?? selectedCardObj[selectedCardObj.type] ?? 0} +E:${selectedCardObj.economy ?? 0} +S:${selectedCardObj.society ?? 0} +H:${selectedCardObj.health ?? 0}`
            : "All 19 hazard & all-aspect adaptation cards"}
        </FormHelperText>
      </FormControl>

      {/* Play Button (applies immediately, no blocking modal) */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={
          controlsDisabled || !selectedTown || !selectedCard || insufficientEp
        }
        onClick={handleApplyCard}
        sx={{ mt: 1.5 }}
      >
        {insufficientEp ? "Not Enough Effort Points" : "Play Card"}
      </Button>

      {/* Current round played cards for selected town */}
      {selectedTown && currentRoundPlays.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="bold">
            Played this year ({2050 + currentRound}):
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
            {currentRoundPlays.map((play) => {
              const card = sortedCards.find((c) => c.id === play.cardId);
              return (
                <Chip
                  key={play.id}
                  label={card?.name || play.cardId}
                  size="small"
                  onDelete={
                    onRemoveCardPlay && !disabled
                      ? () => onRemoveCardPlay(play.id)
                      : undefined
                  }
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CardControls;
