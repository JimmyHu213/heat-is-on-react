import { t, townLabel } from '../../../i18n';
// src/components/Game/components/CardControls.jsx

import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormHelperText,
} from "@mui/material";
import { allCards } from "../../../constants/cards";

/**
 * Component for adaptation card controls
 */
const CardControls = ({ towns, onPlayCard, disabled, currentRound }) => {
  // State
  const [selectedTown, setSelectedTown] = useState("");
  const [selectedCard, setSelectedCard] = useState("");
  const submitting = useRef(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const availableCards = [...allCards].sort((a, b) => a.name.localeCompare(b.name));

  // Handle town selection
  const handleTownChange = (event) => {
    setSelectedTown(event.target.value);
  };

  // Handle card selection
  const handleCardChange = (event) => {
    setSelectedCard(event.target.value);
  };

  // Handle apply card
  const handleApplyCard = () => {
    setDialogOpen(true);
  };

  // Handle confirm card play
  const handleConfirmCard = async () => {
    if (!selectedTown || !selectedCard || disabled || submitting.current) return;
    submitting.current = true;
    try {
      const result = await onPlayCard(selectedTown, selectedCard);
      if (result) { setSelectedCard(""); setDialogOpen(false); }
    } finally { submitting.current = false; }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Find card by ID
  const findCard = (cardId) => {
    return allCards.find((card) => card.id === cardId);
  };

  // Get card color based on type
  const getCardColor = (cardType) => {
    switch (cardType) {
      case "bushfire":
        return "#FF7939";
      case "flood":
        return "#6954AE";
      case "stormSurge":
        return "#34908B";
      case "heatwave":
        return "#FF3B53";
      case "biohazard":
        return "#BA6CD5";
      case "nature":
        return "#527334";
      case "economy":
        return "#C8D2BE";
      case "society":
        return "#E38A6C";
      case "health":
        return "#555555";
      default:
        return "#888888";
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>{t("Play Adaptation Cards")}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>{t("Select a town and play adaptation cards to improve resilience.")}</Typography>

      {/* Town Selection */}
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="town-select-label">{t("Select Town")}</InputLabel>
        <Select
          labelId="town-select-label"
          id="town-select"
          value={selectedTown}
          label={t("Select Town")}
          onChange={handleTownChange}
          disabled={disabled}
        >
          {towns
            .filter((town) => !town.isComparisonTown)
            .map((town) => (
              <MenuItem key={town.id} value={town.id}>
                {townLabel(town)}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {/* Card Selection */}
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="card-select-label">{t("Select Card")}</InputLabel>
        <Select
          labelId="card-select-label"
          id="card-select"
          value={selectedCard}
          label={t("Select Card")}
          onChange={handleCardChange}
          disabled={disabled || !selectedTown}
        >
          {availableCards
            .map((card) => (
              <MenuItem key={card.id} value={card.id}>
                {card.type === "stormSurge"
                  ? t(card.name) + " (" + t("storm surge") + ")"
                  : t(card.name) + " (" + t(card.type) + ")"}
              </MenuItem>
            ))}
        </Select>
        <FormHelperText>{t("All adaptation cards are listed together. The card type shows which resilience scores improve.")}</FormHelperText>
      </FormControl>

      {/* Apply Button */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={disabled || !selectedTown || !selectedCard}
        onClick={handleApplyCard}
        sx={{ mt: 2 }}
      >{t("Apply Card")}</Button>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={disabled ? undefined : handleCloseDialog}>
        <DialogTitle>{t("Apply Adaptation Card")}</DialogTitle>
        <DialogContent>
          <DialogContentText component="div" sx={{ mb: 3 }}>{t("Are you sure you want to apply this card to the selected town?")}</DialogContentText>

          {selectedTown && selectedCard && (
            <>
              <Card
                variant="outlined"
                sx={{
                  borderColor: getCardColor(findCard(selectedCard)?.type || ""),
                  borderWidth: 5,
                  borderRadius: 2,
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t(findCard(selectedCard)?.name)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >{t("Type:")}{t(findCard(selectedCard)?.type)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >{t("Duration:")}{findCard(selectedCard)?.duration || 1}{t("round(s)")}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>{t("Card Effects:")}</Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2">{t("Nature: +")}{findCard(selectedCard)?.nature}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2">{t("Economy: +")}{findCard(selectedCard)?.economy}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2">{t("Society: +")}{findCard(selectedCard)?.society}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="body2">{t("Health: +")}{findCard(selectedCard)?.health}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      fontWeight: "bold",
                      color:
                        towns.find((t) => t.id === selectedTown)?.effortPoints <
                        findCard(selectedCard)?.cost
                          ? "error.main"
                          : "success.main",
                    }}
                  >{t("Cost:")}{findCard(selectedCard)?.cost}{t(" points (Available:")}{" "}
                    {towns.find((t) => t.id === selectedTown)?.effortPoints})
                  </Typography>
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={disabled} onClick={handleCloseDialog}>{t("Cancel")}</Button>
          <Button
            disabled={disabled}
            onClick={handleConfirmCard}
            color="primary"
            variant="contained"
          >{t("Apply Card")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CardControls;
