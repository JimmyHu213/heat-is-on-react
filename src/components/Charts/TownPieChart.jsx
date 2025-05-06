import React from "react";
import { Box, Typography } from "@mui/material";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
  primaryColor,
  primaryColorLight,
  secondaryColor,
} from "../../constants/palette";

// Icons
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import FloodIcon from "@mui/icons-material/Flood";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import BugReportIcon from "@mui/icons-material/BugReport";

const TownPieChart = ({ town, isComparisonTown = false }) => {
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
  const innerRadius = 5; // Inner circle radius

  return (
    <Box
      sx={{
        bgcolor: "grey.200",
        borderRadius: 2,
        boxShadow: 2,
        p: 2,
        height: "400px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "280px",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 280,
          height: 280,
        }}
      >
        <svg width="280" height="280" viewBox="0 0 280 280">
          {/* Render hazard wedges */}
          {hazards.map((hazard) => {
            // For each hazard, create wedges for each aspect
            return aspects.map((aspect, aspectIndex) => {
              const value = town[hazard.id][aspect];
              if (value === undefined) return null;

              // Each aspect gets a segment within the hazard's 72 degree section
              const segmentSize = 72 / aspects.length;
              const startAngle = hazard.startAngle + aspectIndex * segmentSize;
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
              const labelRadius = innerRadius * 2 + (outerRadius - innerRadius);
              const labelX = centerX + labelRadius * Math.cos(midAngle);
              const labelY = centerY + labelRadius * Math.sin(midAngle);

              // Badge position - similar to your badgePositionPercentageOffset: 0.8
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
            strokeWidth="1.5"
            strokeDasharray="5,2"
          />

          {/* Hazard icons */}
          <g>
            {/* Bushfire - top */}
            <foreignObject x={220} y={20} width={30} height={30}>
              <LocalFireDepartmentIcon
                style={{ color: bushfireColor1, fontSize: 24 }}
              />
            </foreignObject>

            {/* Flood - right */}
            <foreignObject x={250} y={centerY} width={30} height={30}>
              <FloodIcon style={{ color: floodColor1, fontSize: 24 }} />
            </foreignObject>

            {/* Storm Surge - bottom right */}
            <foreignObject
              x={centerX - 15}
              y={centerY + 110}
              width={30}
              height={30}
            >
              <ThunderstormIcon
                style={{ color: stormSurgeColor1, fontSize: 24 }}
              />
            </foreignObject>

            {/* Heatwave - bottom left */}
            <foreignObject x={10} y={centerY} width={30} height={30}>
              <WbSunnyIcon style={{ color: heatwaveColor1, fontSize: 24 }} />
            </foreignObject>

            {/* Biohazard - left */}
            <foreignObject x={40} y={20} width={30} height={30}>
              <BugReportIcon style={{ color: biohazardColor1, fontSize: 24 }} />
            </foreignObject>
          </g>
        </svg>
        <Box
          sx={{
            position: "inherit",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            bgcolor: primaryColorLight,
            borderRadius: 10,
            justifySelf: "center",
            marginTop: 2,
            boxShadow: 2,
            width: "80%",
            padding: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            gutterBottom
            sx={{ color: secondaryColor, textAlign: "center", my: "auto" }}
          >
            {town.name}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TownPieChart;
