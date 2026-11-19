// src/components/Game/components/TownPieCharts.jsx
import React, { useLayoutEffect, useRef, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import FlipCameraAndroidIcon from "@mui/icons-material/FlipCameraAndroid";
import TownPieChart from "../../Charts/TownPieChart";
import { ASPECTS, HAZARD_IDS } from "../../../game/scores.js";

function displayedTown(town, before, after, progress) {
  if (!before) return town;
  if (!after || progress === 0) return before;

  const scores = Object.fromEntries(HAZARD_IDS.map((hazard) => [
    hazard,
    Object.fromEntries(ASPECTS.map((aspect) => {
      const start = before[hazard][aspect];
      return [aspect, start + (after[hazard][aspect] - start) * progress];
    })),
  ]));
  return { ...town, ...scores };
}

const TownPieCharts = ({ towns, currentStage, hazardPresentation, hazardProgress }) => {
  const [flippedMap, setFlippedMap] = useState({});
  const gridRef = useRef(null);
  const [availableHeight, setAvailableHeight] = useState(600);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateHeight = () => {
      const documentTop = grid.getBoundingClientRect().top + window.scrollY;
      setAvailableHeight(Math.max(0, window.innerHeight - documentTop - 8));
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    const main = grid.closest("main");
    if (main) {
      for (const section of main.children) {
        if (!section.contains(grid)) observer.observe(section);
      }
    }
    if (grid.previousElementSibling) observer.observe(grid.previousElementSibling);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [towns?.length]);

  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  const cardGap = 10;
  const desktopRows = Math.ceil(towns.length / 3);
  const desktopCardSize = Math.max(180, Math.floor(
    (availableHeight - (desktopRows - 1) * cardGap) / desktopRows
  ));
  const beforeById = new Map(hazardPresentation?.before.map((town) => [town.id, town]));
  const afterById = new Map(hazardPresentation?.after?.map((town) => [town.id, town]));
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
          mb: 0.5,
          gap: 0.5,
        }}
      >
        <Typography variant="caption" sx={{ color: "white" }}>
          {currentStage === "review"
            ? "Review Stage: Click any town card (or Flip All) to compare NESH resilience."
            : "Click any town card to flip between its NESH wheel and NESH bars."}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          startIcon={<FlipCameraAndroidIcon />}
          onClick={handleToggleAll}
        >
          {allFlipped ? "Flip All to Charts" : "Flip All to NESH"}
        </Button>
      </Box>

      <Box
        ref={gridRef}
        style={{ "--desktop-town-card-size": `${desktopCardSize}px` }}
        sx={{
          mb: 0.5,
          display: "grid",
          width: "100%",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
          gap: `${cardGap}px`,
          mx: "auto",
          maxWidth: {
            md: `calc(3 * var(--desktop-town-card-size) + ${2 * cardGap}px)`,
          },
        }}
      >
        {towns.map((town) => (
          <TownPieChart
            key={town.id}
            town={displayedTown(town, beforeById.get(town.id), afterById.get(town.id), hazardProgress)}
            flipped={Boolean(flippedMap[town.id])}
            onToggleFlip={() => handleToggleTown(town.id)}
          />
        ))}
      </Box>
    </>
  );
};

export default TownPieCharts;
