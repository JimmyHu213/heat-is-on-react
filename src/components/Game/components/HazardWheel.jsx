// src/components/Game/components/HazardWheel.jsx
import React, { useState, useRef, useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../../constants/palette";
import { spinHazardWheel } from "../../../game/wheel.js";

const HAZARD_COLORS = {
  bushfire: bushfireColor1,
  flood: floodColor1,
  stormSurge: stormSurgeColor1,
  heatwave: heatwaveColor1,
  biohazard: biohazardColor1,
};

export default function HazardWheel({ hazards, disabled, onSelectHazard }) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSpin = () => {
    if (disabled || isSpinning || !hazards || hazards.length === 0) return;

    const result = spinHazardWheel(hazards);
    const chosenHazard =
      hazards.find((h) => h.id === result.hazardId) || hazards[result.index];

    // Accumulate full turns so every spin rotates forward smoothly
    const currentBaseTurns = Math.floor(rotation / 360) * 360;
    const nextRotation = currentBaseTurns + 360 + result.rotationDegrees;

    setIsSpinning(true);
    setRotation(nextRotation);

    timerRef.current = setTimeout(() => {
      setIsSpinning(false);
      if (onSelectHazard && chosenHazard) {
        onSelectHazard(chosenHazard);
      }
    }, 2200);
  };

  const count = hazards.length || 5;
  const sliceAngle = 360 / count;
  const cx = 120;
  const cy = 120;
  const radius = 105;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        my: 1.5,
      }}
    >
      {/* Pointer indicator at top (12 o'clock) */}
      <Box
        sx={{
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: "18px solid #222",
          mb: -0.5,
          zIndex: 2,
        }}
      />

      <Box
        sx={{
          width: 240,
          height: 240,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="240"
          height="240"
          viewBox="0 0 240 240"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? "transform 2.1s cubic-bezier(0.15, 0.85, 0.25, 1)"
              : "none",
          }}
        >
          {hazards.map((hazard, index) => {
            const startDeg = index * sliceAngle;
            const endDeg = startDeg + sliceAngle;
            const startRad = ((startDeg - 90) * Math.PI) / 180;
            const endRad = ((endDeg - 90) * Math.PI) / 180;

            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);

            const path = [
              `M ${cx} ${cy}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 0 1 ${x2} ${y2}`,
              "Z",
            ].join(" ");

            const midDeg = startDeg + sliceAngle / 2;
            const midRad = ((midDeg - 90) * Math.PI) / 180;
            const labelRadius = radius * 0.62;
            const lx = cx + labelRadius * Math.cos(midRad);
            const ly = cy + labelRadius * Math.sin(midRad);
            const color = HAZARD_COLORS[hazard.id] || "#666";

            return (
              <g key={hazard.id}>
                <path
                  d={path}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={lx}
                  y={ly}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${midDeg}, ${lx}, ${ly})`}
                >
                  {hazard.name}
                </text>
              </g>
            );
          })}
          <circle
            cx={cx}
            cy={cy}
            r={22}
            fill="#ffffff"
            stroke="#333333"
            strokeWidth="2"
          />
        </svg>
      </Box>

      <Button
        variant="contained"
        color="warning"
        startIcon={<CasinoIcon />}
        onClick={handleSpin}
        disabled={disabled || isSpinning}
        sx={{ mt: 1.5, fontWeight: "bold" }}
      >
        {isSpinning ? "Spinning..." : "Spin Hazard Wheel"}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        Spinning selects a hazard; you will confirm before applying it.
      </Typography>
    </Box>
  );
}
