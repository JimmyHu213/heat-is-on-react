// src/components/Game/components/BarChartsView.jsx
import React from "react";
import { Box, Grid, Paper, Typography, useTheme } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  natureColor,
  economyColor,
  societyColor,
  healthColor,
  primaryColorLight,
} from "../../../constants/palette";
import TownPieChart from "../../Charts/TownPieChart";

const BarChartsView = ({ towns }) => {
  const theme = useTheme();

  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  // Find the comparison town
  const comparisonTown = towns.find((town) => town.isComparisonTown);

  // Filter out the comparison town for the regular town data
  const regularTowns = towns.filter((town) => !town.isComparisonTown);

  // Prepare aspect summary data
  const prepareAspectData = () => {
    const aspects = ["nature", "economy", "society", "health"];
    const aspectLabels = ["Nature", "Economy", "Society", "Health"];

    return aspects.map((aspect, index) => {
      // Sum all towns' values for this aspect across all hazards
      let sum = 0;
      regularTowns.forEach((town) => {
        sum += town.bushfire[aspect] || 0;
        sum += town.flood[aspect] || 0;
        sum += town.stormSurge[aspect] || 0;
        sum += town.heatwave[aspect] || 0;
        sum += town.biohazard[aspect] || 0;
      });

      return {
        name: aspectLabels[index],
        value: sum,
        // Add individual values for each aspect type
        natureValue: aspect === "nature" ? sum : 0,
        economyValue: aspect === "economy" ? sum : 0,
        societyValue: aspect === "society" ? sum : 0,
        healthValue: aspect === "health" ? sum : 0,
      };
    });
  };

  // Prepare town summary data
  const prepareTownData = () => {
    return regularTowns.map((town) => {
      // Calculate total points for each aspect
      const nature =
        (town.bushfire?.nature || 0) +
        (town.flood?.nature || 0) +
        (town.stormSurge?.nature || 0) +
        (town.heatwave?.nature || 0) +
        (town.biohazard?.nature || 0);

      const economy =
        (town.bushfire?.economy || 0) +
        (town.flood?.economy || 0) +
        (town.stormSurge?.economy || 0) +
        (town.heatwave?.economy || 0) +
        (town.biohazard?.economy || 0);

      const society =
        (town.bushfire?.society || 0) +
        (town.flood?.society || 0) +
        (town.stormSurge?.society || 0) +
        (town.heatwave?.society || 0) +
        (town.biohazard?.society || 0);

      const health =
        (town.bushfire?.health || 0) +
        (town.flood?.health || 0) +
        (town.stormSurge?.health || 0) +
        (town.heatwave?.health || 0) +
        (town.biohazard?.health || 0);

      return {
        name: town.name,
        nature,
        economy,
        society,
        health,
        total: nature + economy + society + health,
      };
    });
  };

  // Calculate max value for Y axis
  const calculateMaxY = (data) => {
    let max = 0;

    data.forEach((item) => {
      if (item.total && item.total > max) {
        max = item.total;
      }
      if (item.value && item.value > max) {
        max = item.value;
      }
    });

    // Round up to nearest multiple of 500
    return Math.ceil(max / 500) * 500;
  };

  const aspectData = prepareAspectData();
  const townData = prepareTownData();
  const maxY = Math.max(calculateMaxY(aspectData), calculateMaxY(townData));

  // Custom tooltip formatter
  const renderTooltip = (props) => {
    const { active, payload, label } = props;

    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1, boxShadow: 2, bgcolor: primaryColorLight }}>
          <Typography variant="subtitle2">{label}</Typography>
          {payload.map((entry, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color, fontWeight: "bold" }}
            >
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }

    return null;
  };

  // Custom label renderer for bar values
  const renderCustomBarLabel = (props) => {
    const { x, y, width, height, value } = props;

    // Only render if value is greater than 0
    if (!value || value <= 0) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 10}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="bold"
        fontSize="12"
        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
      >
        {value}
      </text>
    );
  };

  // Custom label renderer for the total at the top of stacked bars
  const renderTotalLabel = (props) => {
    const { x, y, width, index } = props;

    // Get the total for this town
    const total = townData[index].total;

    return (
      <text
        x={x - width / 2 - 5}
        y={y - 10} // Fixed position at the top of the chart
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="bold"
        fontSize="14"
        style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}
      >
        {total}
      </text>
    );
  };

  return (
    <Grid container spacing={3} justifyContent={"space-between"} sx={{ m: 4 }}>
      {/* Aspects Summary Chart */}
      <Grid item xs={12} md={6}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            boxShadow: 2,
            height: 400,
            width: "500px",
            bgcolor: "#2c4260", // Changed from theme.palette.background.paper to the specified color
          }}
        >
          <Typography
            variant="h6"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "#fff" }} // Adding white text color for better contrast
          >
            Aspects Summary
          </Typography>
          <Box sx={{ height: 330, width: "100%" }}>
            <ResponsiveContainer>
              <BarChart
                data={aspectData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={30}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#fff", fontWeight: "bold" }}
                  //axisLine={{ strokeWidth: 1, stroke: "#fff" }}
                  //tickLine={{ strokeWidth: 1, stroke: "#fff" }}
                />
                <YAxis
                  domain={[0, maxY]}
                  tick={{ fontSize: 12, fill: "#fff", fontWeight: "bold" }}
                  tickCount={6}
                  //axisLine={{ strokeWidth: 1, stroke: "#fff" }}
                  //tickLine={{ strokeWidth: 1, stroke: "#fff" }}
                />
                <Tooltip content={renderTooltip} />
                <Bar
                  dataKey="natureValue"
                  name="Nature"
                  fill={natureColor}
                  radius={[4, 4, 4, 4]}
                  animationDuration={500}
                  label={renderCustomBarLabel}
                />
                <Bar
                  dataKey="economyValue"
                  name="Economy"
                  fill={economyColor}
                  radius={[4, 4, 4, 4]}
                  animationDuration={600}
                  label={renderCustomBarLabel}
                />
                <Bar
                  dataKey="societyValue"
                  name="Society"
                  fill={societyColor}
                  radius={[4, 4, 4, 4]}
                  animationDuration={700}
                  label={renderCustomBarLabel}
                />
                <Bar
                  dataKey="healthValue"
                  name="Health"
                  fill={healthColor}
                  radius={[4, 4, 4, 4]}
                  animationDuration={800}
                  label={renderCustomBarLabel}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Towns Summary Chart */}
      <Grid item xs={12} md={6}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            boxShadow: 2,
            height: 400,
            width: "600px",
            bgcolor: "#2c4260", // Changed from theme.palette.background.paper to the specified color
          }}
        >
          <Typography
            variant="h6"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "#fff" }} // Adding white text color for better contrast
          >
            Towns Summary
          </Typography>
          <Box sx={{ height: 330, width: "100%" }}>
            <ResponsiveContainer>
              <BarChart
                data={townData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={30}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#fff", fontWeight: "bold" }}
                  //axisLine={{ strokeWidth: 1, stroke: "#fff" }}
                  //tickLine={{ strokeWidth: 1, stroke: "#fff" }}
                />
                <YAxis
                  domain={[0, maxY]}
                  tick={{ fontSize: 12, fill: "#fff", fontWeight: "bold" }}
                  tickCount={6}
                  //axisLine={{ strokeWidth: 1, stroke: "#fff" }}
                  //tickLine={{ strokeWidth: 1, stroke: "#fff" }}
                />
                <Tooltip content={renderTooltip} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#fff" }} />
                <Bar
                  dataKey="nature"
                  name="Nature"
                  stackId="a"
                  radius={[0, 0, 4, 4]}
                  fill={natureColor}
                  animationDuration={500}
                />
                <Bar
                  dataKey="economy"
                  name="Economy"
                  stackId="a"
                  fill={economyColor}
                  animationDuration={600}
                />
                <Bar
                  dataKey="society"
                  name="Society"
                  stackId="a"
                  fill={societyColor}
                  animationDuration={700}
                />
                <Bar
                  dataKey="health"
                  name="Health"
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                  fill={healthColor}
                  animationDuration={800}
                />
                {/* Additional bar to show total at the top */}
                <Bar
                  dataKey="total"
                  stackId="b"
                  fill="transparent"
                  label={renderTotalLabel}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Comparison Town Chart */}
      {comparisonTown && (
        <Grid item xs={12} md={4}>
          <TownPieChart town={comparisonTown} isComparisonTown={true} />
        </Grid>
      )}
    </Grid>
  );
};

export default BarChartsView;
