// src/components/Game/components/HazardWheel.jsx
import React, { useState, useRef, useEffect } from "react";
import { Box, Button } from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import HazardIcon from "../../common/HazardIcon";
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

export default function HazardWheel({ hazards, disabled, isSpinning, onSpinningChange, onSelectHazard }) {
  const [rotation, setRotation] = useState(0);
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

    onSpinningChange(true);
    setRotation(nextRotation);

    timerRef.current = setTimeout(() => {
      onSpinningChange(false);
      if (onSelectHazard && chosenHazard) {
        onSelectHazard(chosenHazard);
      }
    }, 4500);
  };

  const spinTransition = isSpinning ? "transform 4.4s cubic-bezier(0.12, 0.88, 0.22, 1)" : "none";
  const count = hazards.length || 6;
  const sliceAngle = 360 / count;
  const cx = 170;
  const cy = 170;
  const radius = 152;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        my: 1,
      }}
    >
      {/* Pointer indicator at top (12 o'clock) */}
      <Box
        sx={{
          width: 0,
          height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderTop: "20px solid #222",
          mb: -0.5,
          zIndex: 2,
        }}
      />

      <Box
        sx={{
          width: "min(440px, 52vh)",
          height: "min(440px, 52vh)",
          maxWidth: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 340 340"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinTransition,
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
            const color = hazard.color || HAZARD_COLORS[hazard.id] || "#666";

            return (
              <g key={hazard.id}>
                <title>{hazard.isMystery ? "Mystery event" : hazard.name}</title>
                <path
                  d={path}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <g transform={`translate(${lx} ${ly})`}>
                  <g style={{ transform: `rotate(${-rotation}deg)`, transition: spinTransition }}>
                    <text y="-20" fill="#172329" stroke="white" strokeWidth="2.5"
                      paintOrder="stroke" fontSize="13" fontWeight="bold" textAnchor="middle">
                      {hazard.isMystery ? "Mystery" : hazard.name}
                    </text>
                    <foreignObject x="-19" y="-12" width="38" height="38">
                      <HazardIcon hazardId={hazard.id} size={38} />
                    </foreignObject>
                  </g>
                </g>
              </g>
            );
          })}
          <circle
            cx={cx}
            cy={cy}
            r={28}
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
        sx={{ mt: 1, fontWeight: "bold" }}
      >
        {isSpinning ? "Spinning..." : "Spin Hazard Wheel"}
      </Button>
    </Box>
  );
}
