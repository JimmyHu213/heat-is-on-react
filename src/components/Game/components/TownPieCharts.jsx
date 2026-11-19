// src/components/Game/components/TownPieCharts.jsx
import React, { useLayoutEffect, useRef, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import FlipCameraAndroidIcon from "@mui/icons-material/FlipCameraAndroid";
import TownPieChart from "../../Charts/TownPieChart";

const TownPieCharts = ({ towns, currentStage }) => {
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
    if (main) observer.observe(main);
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

  const cardGap = 6;
  const desktopRows = Math.ceil(towns.length / 3);
  const enlargedCardSize = Math.ceil(
    Math.max(200, (availableHeight - (desktopRows - 1) * cardGap) / desktopRows) * 1.8
  );
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
          gridColumn: { lg: 1 },
          gridRow: { lg: 1 },
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
        style={{ "--enlarged-town-card-size": `${enlargedCardSize}px` }}
        sx={{
          gridColumn: { lg: 1 },
          gridRow: { lg: 2 },
          mb: 0.5,
          display: "grid",
          width: "100%",
          maxWidth: {
            xs: "var(--town-card-size)",
            sm: `calc(2 * var(--town-card-size) + ${cardGap}px)`,
            md: `calc(3 * var(--town-card-size) + ${2 * cardGap}px)`,
          },
          justifySelf: "center",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
          gap: `${cardGap}px`,
          justifyContent: "center",
          justifyItems: "center",
          alignItems: "start",
          "--town-card-size": {
            xs: "756px",
            md: "var(--enlarged-town-card-size)",
          },
        }}
      >
        {towns.map((town) => (
          <TownPieChart
            key={town.id}
            town={town}
            flipped={Boolean(flippedMap[town.id])}
            onToggleFlip={() => handleToggleTown(town.id)}
          />
        ))}
      </Box>
    </>
  );
};

export default TownPieCharts;
