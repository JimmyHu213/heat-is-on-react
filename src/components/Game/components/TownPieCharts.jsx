// src/components/Game/components/TownPieCharts.jsx
import React from "react";
import { Box, Grid, Typography, Stack, useTheme } from "@mui/material";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../../constants/palette";

// Icons
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import FloodIcon from "@mui/icons-material/Flood";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import BugReportIcon from "@mui/icons-material/BugReport";

// SVG-based pie chart for better control
const TownPieCharts = ({ towns }) => {
  const theme = useTheme();

  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  // Aspect legend
  const aspectLegend = (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
      {[
        { id: "nature", label: "N - Nature" },
        { id: "economy", label: "E - Economy" },
        { id: "society", label: "S - Society" },
        { id: "health", label: "H - Health" },
      ].map((aspect) => (
        <Box
          key={aspect.id}
          sx={{ mx: 2, display: "flex", alignItems: "center" }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "grey.400",
              mr: 1,
            }}
          />
          <Typography variant="body2">{aspect.label}</Typography>
        </Box>
      ))}
    </Box>
  );

  // Render a town chart
  const renderTownChart = (town) => {
    // Calculate radial positions for each slice group
    // Each hazard gets 72 degrees of the circle (360 / 5 = 72)
    const hazards = [
      {
        id: "bushfire",
        name: "Bushfire",
        color: bushfireColor1,
        icon: <LocalFireDepartmentIcon />,
        startAngle: 0,
      },
      {
        id: "flood",
        name: "Flood",
        color: floodColor1,
        icon: <FloodIcon />,
        startAngle: 72,
      },
      {
        id: "stormSurge",
        name: "Storm Surge",
        color: stormSurgeColor1,
        icon: <ThunderstormIcon />,
        startAngle: 144,
      },
      {
        id: "heatwave",
        name: "Heatwave",
        color: heatwaveColor1,
        icon: <WbSunnyIcon />,
        startAngle: 216,
      },
      {
        id: "biohazard",
        name: "Biohazard",
        color: biohazardColor1,
        icon: <BugReportIcon />,
        startAngle: 288,
      },
    ];

    const aspects = ["nature", "economy", "society", "health"];
    const centerX = 140; // Center X coordinate
    const centerY = 140; // Center Y coordinate
    const innerRadius = 30; // Inner circle radius

    return (
      <Box
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 1,
          p: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          align="center"
          gutterBottom
        >
          {town.name}
        </Typography>

        <Box sx={{ position: "relative", width: 280, height: 280 }}>
          <svg width="280" height="280" viewBox="0 0 280 280">
            {/* Render hazard wedges */}
            {hazards.map((hazard) => {
              // For each hazard, create wedges for each aspect
              return aspects.map((aspect, aspectIndex) => {
                const value = town[hazard.id][aspect];
                if (value === undefined) return null;

                // Each aspect gets a segment within the hazard's 72 degree section
                const segmentSize = 72 / aspects.length;
                const startAngle =
                  hazard.startAngle + aspectIndex * segmentSize;
                const endAngle = startAngle + segmentSize;

                // Convert to radians
                const startRad = ((startAngle - 90) * Math.PI) / 180;
                const endRad = ((endAngle - 90) * Math.PI) / 180;

                // Calculate outer radius based on value
                const outerRadius = innerRadius + value;

                // Calculate points for path
                const x1 = centerX + innerRadius * Math.cos(startRad);
                const y1 = centerY + innerRadius * Math.sin(startRad);
                const x2 = centerX + outerRadius * Math.cos(startRad);
                const y2 = centerY + outerRadius * Math.sin(startRad);
                const x3 = centerX + outerRadius * Math.cos(endRad);
                const y3 = centerY + outerRadius * Math.sin(endRad);
                const x4 = centerX + innerRadius * Math.cos(endRad);
                const y4 = centerY + innerRadius * Math.sin(endRad);

                // Flag for large arc
                const largeArcFlag = segmentSize > 180 ? 1 : 0;

                // Create path
                const path = [
                  `M ${x1} ${y1}`, // Move to inner start
                  `L ${x2} ${y2}`, // Line to outer start
                  `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}`, // Arc to outer end
                  `L ${x4} ${y4}`, // Line to inner end
                  `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}`, // Arc back to start
                  "Z", // Close path
                ].join(" ");

                // Label position - middle of wedge
                const midAngle =
                  (((startAngle + endAngle) / 2) * Math.PI) / 180 - Math.PI / 2;
                const labelRadius =
                  innerRadius + (outerRadius - innerRadius) * 0.5;
                const labelX = centerX + labelRadius * Math.cos(midAngle);
                const labelY = centerY + labelRadius * Math.sin(midAngle);

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
                      fill="#000"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {value}
                    </text>
                  </g>
                );
              });
            })}

            {/* Center circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius}
              fill="#f5f5f5"
              stroke="#ddd"
            />

            {/* Danger threshold circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius + 20}
              fill="none"
              stroke="rgba(255,0,0,0.6)"
              strokeWidth="2"
              strokeDasharray="5,2"
            />

            {/* Hazard icons */}
            <g>
              {/* Bushfire - top */}
              <foreignObject x={centerX - 15} y={40} width={30} height={30}>
                <LocalFireDepartmentIcon
                  style={{ color: bushfireColor1, fontSize: 24 }}
                />
              </foreignObject>
              <text
                x={centerX}
                y={30}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
              >
                Bushfire
              </text>

              {/* Flood - right */}
              <foreignObject x={210} y={centerY - 15} width={30} height={30}>
                <FloodIcon style={{ color: floodColor1, fontSize: 24 }} />
              </foreignObject>
              <text
                x={225}
                y={centerY - 25}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
              >
                Flood
              </text>

              {/* Storm Surge - bottom right */}
              <foreignObject x={190} y={200} width={30} height={30}>
                <ThunderstormIcon
                  style={{ color: stormSurgeColor1, fontSize: 24 }}
                />
              </foreignObject>
              <text x={190} y={240} fontSize="10" fontWeight="bold">
                Storm Surge
              </text>

              {/* Heatwave - bottom left */}
              <foreignObject x={60} y={200} width={30} height={30}>
                <WbSunnyIcon style={{ color: heatwaveColor1, fontSize: 24 }} />
              </foreignObject>
              <text
                x={75}
                y={240}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
              >
                Heatwave
              </text>

              {/* Biohazard - left */}
              <foreignObject x={40} y={centerY - 15} width={30} height={30}>
                <BugReportIcon
                  style={{ color: biohazardColor1, fontSize: 24 }}
                />
              </foreignObject>
              <text
                x={55}
                y={centerY - 25}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
              >
                Biohazard
              </text>
            </g>
          </svg>
        </Box>
      </Box>
    );
  };

  return (
    <>
      {aspectLegend}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {towns.map((town) => (
          <Grid item xs={12} sm={6} md={4} key={town.id}>
            {renderTownChart(town)}
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default TownPieCharts;
