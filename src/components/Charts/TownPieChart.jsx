// src/components/Charts/TownPieChart.jsx
import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  Divider,
  Tooltip,
} from "@mui/material";
import FlipCameraAndroidIcon from "@mui/icons-material/FlipCameraAndroid";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
  natureColor,
  economyColor,
  societyColor,
  healthColor,
  primaryColorLight,
  secondaryColor,
} from "../../constants/palette";
import {
  MAX_SCORE,
  WEAK_SEGMENT_MAX,
  countSegments,
  neshAverages,
  overallResilience,
} from "../../game/scores.js";
import HazardIcon from "../common/HazardIcon";

const TownPieChart = ({ town, flipped = false, onToggleFlip }) => {
  const hazards = [
    {
      id: "bushfire",
      name: "Bushfire",
      color: bushfireColor1,
      startAngle: 0,
    },
    {
      id: "flood",
      name: "Flood",
      color: floodColor1,
      startAngle: 72,
    },
    {
      id: "stormSurge",
      name: "Storm Surge",
      color: stormSurgeColor1,
      startAngle: 144,
    },
    {
      id: "heatwave",
      name: "Heatwave",
      color: heatwaveColor1,
      startAngle: 216,
    },
    {
      id: "biohazard",
      name: "Biohazard",
      color: biohazardColor1,
      startAngle: 288,
    },
  ];

  const aspects = ["nature", "economy", "society", "health"];
  const centerX = 140;
  const centerY = 140;
  const innerRadius = 5;

  const avgResilience = overallResilience(town);
  const nesh = neshAverages(town);
  const weakSegments = countSegments(town, (s) => s <= WEAK_SEGMENT_MAX);
  const segmentsAt100 = countSegments(town, (s) => s === MAX_SCORE);

  const aspectBars = [
    { key: "nature", label: "Nature", color: natureColor },
    { key: "economy", label: "Economy", color: economyColor },
    { key: "society", label: "Society", color: societyColor },
    { key: "health", label: "Health", color: healthColor },
  ];

  return (
    <Box
      onClick={onToggleFlip}
      sx={{
        bgcolor: "grey.200",
        borderRadius: 2,
        boxShadow: 2,
        p: 1.25,
        minHeight: "265px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "255px",
        cursor: onToggleFlip ? "pointer" : "default",
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          boxShadow: 4,
        },
      }}
    >
      {/* Top Bar: EP Badge, Flip Button */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 0.25,
        }}
      >
        <Chip
          label={`${town.effortPoints} EP`}
          size="small"
          color="primary"
          sx={{ fontWeight: "bold", height: 22 }}
        />
        {onToggleFlip && (
          <Tooltip title={flipped ? "Show Radial Chart" : "Flip for NESH Averages"}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFlip();
              }}
            >
              <FlipCameraAndroidIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {!flipped ? (
        /* Front: Radial Resilience Chart */
        <Box
          sx={{
            position: "relative",
            width: 190,
            height: 190,
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 280 280">
            {hazards.map((hazard) => {
              return aspects.map((aspect, aspectIndex) => {
                const value = town[hazard.id]?.[aspect];
                if (value === undefined) return null;

                const segmentSize = 72 / aspects.length;
                const startAngle = hazard.startAngle + aspectIndex * segmentSize;
                const endAngle = startAngle + segmentSize;

                const startRad = ((startAngle - 90) * Math.PI) / 180;
                const endRad = ((endAngle - 90) * Math.PI) / 180;

                const outerRadius = innerRadius + value;

                const x1 = centerX + innerRadius * Math.cos(startRad);
                const y1 = centerY + innerRadius * Math.sin(startRad);
                const x2 = centerX + outerRadius * Math.cos(startRad);
                const y2 = centerY + outerRadius * Math.sin(startRad);
                const x3 = centerX + outerRadius * Math.cos(endRad);
                const y3 = centerY + outerRadius * Math.sin(endRad);
                const x4 = centerX + innerRadius * Math.cos(endRad);
                const y4 = centerY + innerRadius * Math.sin(endRad);

                const largeArcFlag = segmentSize > 180 ? 1 : 0;

                const path = [
                  `M ${x1} ${y1}`,
                  `L ${x2} ${y2}`,
                  `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}`,
                  `L ${x4} ${y4}`,
                  `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}`,
                  "Z",
                ].join(" ");

                const midAngle =
                  (((startAngle + endAngle) / 2) * Math.PI) / 180 - Math.PI / 2;
                const labelRadius = innerRadius * 2 + (outerRadius - innerRadius);
                const labelX = centerX + labelRadius * Math.cos(midAngle);
                const labelY = centerY + labelRadius * Math.sin(midAngle);

                const badgeRadius =
                  innerRadius + (outerRadius - innerRadius) * 0.8;
                const badgeX = centerX + badgeRadius * Math.cos(midAngle);
                const badgeY = centerY + badgeRadius * Math.sin(midAngle);

                return (
                  <g key={`${hazard.id}-${aspect}`}>
                    <path
                      d={path}
                      fill={hazard.color}
                      opacity={0.8}
                      stroke="#fff"
                      strokeWidth="1"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="grey"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {value}
                    </text>
                    {value >= 20 && (
                      <g>
                        <circle
                          cx={badgeX}
                          cy={badgeY}
                          fill={hazard.color}
                          stroke="#fff"
                          strokeWidth="1"
                        />
                        <text
                          x={badgeX}
                          y={badgeY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#fff"
                          fontSize="7"
                          fontWeight="bold"
                        >
                          {aspect[0].toUpperCase()}
                        </text>
                      </g>
                    )}
                  </g>
                );
              });
            })}

            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius}
              fill="#f5f5f5"
              stroke="#ddd"
            />

            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius + 20}
              fill="none"
              stroke="rgba(255,0,0,0.6)"
              strokeWidth="1.5"
              strokeDasharray="5,2"
            />

            <g>
              <foreignObject x={220} y={20} width={30} height={30}>
                <HazardIcon hazardId="bushfire" color={bushfireColor1} size={24} />
              </foreignObject>
              <foreignObject x={250} y={centerY} width={30} height={30}>
                <HazardIcon hazardId="flood" color={floodColor1} size={24} />
              </foreignObject>
              <foreignObject
                x={centerX - 15}
                y={centerY + 110}
                width={30}
                height={30}
              >
                <HazardIcon hazardId="stormSurge" color={stormSurgeColor1} size={24} />
              </foreignObject>
              <foreignObject x={10} y={centerY} width={30} height={30}>
                <HazardIcon hazardId="heatwave" color={heatwaveColor1} size={24} />
              </foreignObject>
              <foreignObject x={40} y={20} width={30} height={30}>
                <HazardIcon hazardId="biohazard" color={biohazardColor1} size={24} />
              </foreignObject>
            </g>
          </svg>
        </Box>
      ) : (
        /* Back: Chunky NESH Averages & Resilience Summary */
        <Box
          sx={{
            width: "100%",
            height: 190,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            px: 0.5,
            py: 0.25,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              Overall Resilience
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
              {avgResilience.toFixed(0)}%
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
            {aspectBars.map((item) => {
              const avg = nesh[item.key] || 0;
              return (
                <Box key={item.key}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.15,
                    }}
                  >
                    <Typography variant="caption" fontWeight="bold">
                      {item.label}
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {avg.toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={avg}
                    sx={{
                      height: 14,
                      borderRadius: 1,
                      bgcolor: "rgba(0,0,0,0.12)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: item.color,
                        borderRadius: 1,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="caption"
              color={weakSegments > 0 ? "error.main" : "text.secondary"}
              fontWeight={weakSegments > 0 ? "bold" : "normal"}
            >
              Weak (≤20%): {weakSegments}
            </Typography>
            <Typography
              variant="caption"
              color={segmentsAt100 > 0 ? "success.main" : "text.secondary"}
              fontWeight={segmentsAt100 > 0 ? "bold" : "normal"}
            >
              100%: {segmentsAt100} (+{segmentsAt100 * 5} EP)
            </Typography>
          </Box>
        </Box>
      )}

      {/* Town Name Pill */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: primaryColorLight,
          borderRadius: 10,
          mt: 1,
          boxShadow: 2,
          width: "85%",
          py: 0.75,
          px: 1.5,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{ color: secondaryColor, textAlign: "center" }}
        >
          {town.name}
        </Typography>
      </Box>
    </Box>
  );
};

export default TownPieChart;
