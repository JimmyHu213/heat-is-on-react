// src/components/Game/components/CardControls.jsx
import React, { useState, useEffect } from "react";
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
  Tabs,
  Tab,
  FormHelperText,
  Alert,
} from "@mui/material";
import { cards, allAbilityCards } from "../../../constants/cards";

const CardControls = ({
  towns,
  onPlayCard,
  disabled,
  currentStage = "adaptation",
}) => {
  const [selectedTown, setSelectedTown] = useState("");
  const [selectedCard, setSelectedCard] = useState("");
  const [cardCategory, setCardCategory] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableCards, setAvailableCards] = useState([]);

  const isAdaptStage = currentStage === "adaptation";
  const controlsDisabled = disabled || !isAdaptStage;

  useEffect(() => {
    setAvailableCards(cards);
  }, []);

  const handleCategoryChange = (event, newValue) => {
    setCardCategory(newValue);
    setSelectedCard("");
    setAvailableCards(newValue === 0 ? cards : allAbilityCards);
  };

  const handleTownChange = (event) => {
    setSelectedTown(event.target.value);
  };

  const handleCardChange = (event) => {
    setSelectedCard(event.target.value);
  };

  const handleApplyCard = () => {
    setDialogOpen(true);
  };

  const handleConfirmCard = () => {
    if (selectedTown && selectedCard) {
      onPlayCard(selectedTown, selectedCard);
      setSelectedCard("");
    }
    setDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const findCard = (cardId) => {
    const allCards = [...cards, ...allAbilityCards];
    return allCards.find((card) => card.id === cardId);
  };

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
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        1. Adapt Stage: Play Adaptation Cards
      </Typography>

      {!isAdaptStage ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Adaptation cards can only be purchased during the <strong>Adapt</strong> stage.
        </Alert>
      ) : (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select a town and play adaptation cards to improve resilience.
          Bludgeton is locked as the comparison town.
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

      {/* Card Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
        <Tabs
          value={cardCategory}
          onChange={handleCategoryChange}
          variant="fullWidth"
          disabled={controlsDisabled}
        >
          <Tab label="Hazard Cards" />
          <Tab label="All-Aspect Cards" />
        </Tabs>
      </Box>

      {/* Card Selection */}
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel id="card-select-label">Select Card</InputLabel>
        <Select
          labelId="card-select-label"
          id="card-select"
          value={selectedCard}
          label="Select Card"
          onChange={handleCardChange}
          disabled={controlsDisabled || !selectedTown}
        >
          {[...availableCards]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((card) => (
              <MenuItem key={card.id} value={card.id}>
                {card.type === "stormSurge"
                  ? `${card.name} (storm surge · ${card.cost} EP)`
                  : `${card.name} (${card.type} · ${card.cost} EP)`}
              </MenuItem>
            ))}
        </Select>
        <FormHelperText>
          {cardCategory === 0
            ? "Hazard cards improve specific hazard resilience"
            : "All-aspect cards improve a specific aspect across all hazards"}
        </FormHelperText>
      </FormControl>

      {/* Apply Button */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={controlsDisabled || !selectedTown || !selectedCard}
        onClick={handleApplyCard}
        sx={{ mt: 2 }}
      >
        Apply Card
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Apply Adaptation Card</DialogTitle>
        <DialogContent>
          <DialogContentText component="div" sx={{ mb: 3 }}>
            Are you sure you want to apply this card to the selected town?
          </DialogContentText>

          {selectedTown && selectedCard && (
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
                  {findCard(selectedCard)?.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                >
                  Type: {findCard(selectedCard)?.type}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                >
                  Duration: {findCard(selectedCard)?.duration || 1} round(s)
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Card Effects:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      Nature: +{findCard(selectedCard)?.nature}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      Economy: +{findCard(selectedCard)?.economy}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      Society: +{findCard(selectedCard)?.society}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      Health: +{findCard(selectedCard)?.health}
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
                >
                  Cost: {findCard(selectedCard)?.cost} points (Available:{" "}
                  {towns.find((t) => t.id === selectedTown)?.effortPoints})
                </Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmCard}
            color="primary"
            variant="contained"
            disabled={controlsDisabled}
          >
            Apply Card
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CardControls;
