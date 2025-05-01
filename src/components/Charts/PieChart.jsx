import React from "react";
import { Card, Box, Button, Stack } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  PolarAngleAxis,
  PolarRadiusAxis,
  PolarGrid,
} from "recharts";

// Hazard type icons
import BugReportIcon from "@mui/icons-material/BugReport"; // Biohazard - purple
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment"; // Bushfire - orange
import WbSunnyIcon from "@mui/icons-material/WbSunny"; // Heatwave - red
import FloodIcon from "@mui/icons-material/Flood"; // Flood - teal
import CloudIcon from "@mui/icons-material/Cloud"; // Storm - blue

// Define colors for each hazard type
const COLORS = {
  biohazard: "#9c27b0", // Purple
  bushfire: "#ff5722", // Orange
  heatwave: "#f44336", // Red
  flood: "#009688", // Teal
  storm: "#3f51b5", // Blue
};

// Custom component for a radial section with text
const RadialSection = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  value,
  type,
}) => {
  const RADIAN = Math.PI / 180;
  // Calculate the middle point for label placement
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Calculate a point near the outer edge for the value
  const valueRadius = innerRadius + (outerRadius - innerRadius) * 0.75;
  const valueX = cx + valueRadius * Math.cos(-midAngle * RADIAN);
  const valueY = cy + valueRadius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      {/* The pie section */}
      <path
        d={`M ${cx},${cy} L ${
          cx + outerRadius * Math.cos(-startAngle * RADIAN)
        },${cy + outerRadius * Math.sin(-startAngle * RADIAN)} 
            A ${outerRadius},${outerRadius} 0 ${
          endAngle - startAngle > 180 ? 1 : 0
        },0 
            ${cx + outerRadius * Math.cos(-endAngle * RADIAN)},${
          cy + outerRadius * Math.sin(-endAngle * RADIAN)
        } Z`}
        fill={fill}
      />

      {/* The hazard type letter */}
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="bold"
        fontSize={16}
      >
        {type.charAt(0).toUpperCase()}
      </text>

      {/* The value number */}
      <text
        x={valueX}
        y={valueY}
        fill="#FFFFFF"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14}
      >
        {value}
      </text>
    </g>
  );
};

const RadialHazardChart = ({ data, townName, townColor = "#4CAF50" }) => {
  // Format the data for the chart
  const chartData = [];

  // Group data by hazard category
  const groupedData = {
    biohazard: [],
    bushfire: [],
    heatwave: [],
    flood: [],
    storm: [],
  };

  // Organize data into hazard categories
  data.forEach((item) => {
    groupedData[item.hazardType].push(item);
  });

  // Convert grouped data to chart format with proper angles
  // Each hazard gets a 72-degree segment (360 / 5 = 72)
  let startAngle = 0;
  Object.entries(groupedData).forEach(([hazardType, items]) => {
    const segmentSize = 72 / items.length;

    items.forEach((item, index) => {
      chartData.push({
        name: item.name,
        value: item.value,
        startAngle: startAngle + index * segmentSize,
        endAngle: startAngle + (index + 1) * segmentSize,
        hazardType: item.hazardType,
        fill: COLORS[hazardType],
      });
    });

    startAngle += 72;
  });

  return (
    <Card
      sx={{
        bgcolor: "grey.100",
        borderRadius: 4,
        boxShadow: 2,
        p: 1,
        width: 340,
        height: 400,
      }}
    >
      <Stack
        direction="column"
        alignItems="center"
        justifyContent="space-between"
        sx={{ height: "100%" }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 300,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* The main chart */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Custom rendering for each section */}
              <g>
                {chartData.map((entry, index) => (
                  <RadialSection
                    key={`section-${index}`}
                    cx={150}
                    cy={150}
                    innerRadius={50}
                    outerRadius={120}
                    startAngle={entry.startAngle}
                    endAngle={entry.endAngle}
                    midAngle={(entry.startAngle + entry.endAngle) / 2}
                    fill={entry.fill}
                    value={entry.value}
                    type={entry.name}
                  />
                ))}
              </g>

              {/* Hazard icons positioned around the chart */}
              {/* Biohazard (purple) - left side */}
              <foreignObject x={0} y={150} width={40} height={40}>
                <BugReportIcon
                  style={{ color: COLORS.biohazard, fontSize: 30 }}
                />
              </foreignObject>

              {/* Bushfire (orange) - top right */}
              <foreignObject x={260} y={50} width={40} height={40}>
                <LocalFireDepartmentIcon
                  style={{ color: COLORS.bushfire, fontSize: 30 }}
                />
              </foreignObject>

              {/* Heatwave (red) - left side */}
              <foreignObject x={20} y={50} width={40} height={40}>
                <WbSunnyIcon style={{ color: COLORS.heatwave, fontSize: 30 }} />
              </foreignObject>

              {/* Flood (teal) - bottom */}
              <foreignObject x={140} y={270} width={40} height={40}>
                <FloodIcon style={{ color: COLORS.flood, fontSize: 30 }} />
              </foreignObject>

              {/* Storm (blue) - right side */}
              <foreignObject x={280} y={150} width={40} height={40}>
                <CloudIcon style={{ color: COLORS.storm, fontSize: 30 }} />
              </foreignObject>
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Town name button */}
        <Button
          variant="contained"
          sx={{
            backgroundColor: townColor,
            "&:hover": {
              backgroundColor: townColor,
              opacity: 0.9,
            },
            borderRadius: 8,
            px: 4,
            py: 1,
            mb: 1,
            color: "white",
            fontWeight: "bold",
            minWidth: 120,
          }}
        >
          {townName}
        </Button>
      </Stack>
    </Card>
  );
};

export default RadialHazardChart;
