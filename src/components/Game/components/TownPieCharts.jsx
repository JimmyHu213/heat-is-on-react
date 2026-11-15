// src/components/Game/components/TownPieCharts.jsx
import React, { useState } from "react";
import { Box, Grid, Typography, Button } from "@mui/material";
import FlipCameraAndroidIcon from "@mui/icons-material/FlipCameraAndroid";
import TownPieChart from "../../Charts/TownPieChart";

const TownPieCharts = ({ towns, currentStage }) => {
  const [flippedMap, setFlippedMap] = useState({});

  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  const allFlipped =
    towns.length > 0 && towns.every((town) => Boolean(flippedMap[town.id]));

  const handleToggleAll = () => {
    const nextState = !allFlipped;
    const nextMap = {};
    for (const town of towns) {
      nextMap[town.id] = nextState;
    }
    setFlippedMap(nextMap);
  };

  const handleToggleTown = (townId) => {
    setFlippedMap((prev) => ({
      ...prev,
      [townId]: !prev[townId],
    }));
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: "white" }}>
          {currentStage === "review"
            ? "Review Stage: Click any town card (or Flip All) to compare dimension averages and dividend readiness."
            : "Click any town card to flip between its 20-segment radial chart and dimension averages."}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          startIcon={<FlipCameraAndroidIcon />}
          onClick={handleToggleAll}
        >
          {allFlipped ? "Flip All to Charts" : "Flip All to Averages"}
        </Button>
      </Box>

      <Grid
        container
        spacing={3}
        sx={{ mb: 3, display: "flex", justifyContent: "space-evenly" }}
      >
        {towns.map((town) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={town.id}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <TownPieChart
              town={town}
              flipped={Boolean(flippedMap[town.id])}
              onToggleFlip={() => handleToggleTown(town.id)}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default TownPieCharts;
