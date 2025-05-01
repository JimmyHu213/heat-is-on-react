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
} from "../../../constants/palette";

const BarChartsView = ({ towns }) => {
  const theme = useTheme();

  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  // Prepare aspect summary data
  const prepareAspectData = () => {
    const aspects = ["nature", "economy", "society", "health"];
    const aspectLabels = ["Nature", "Economy", "Society", "Health"];

    return aspects.map((aspect, index) => {
      // Sum all towns' values for this aspect across all hazards
      let sum = 0;
      towns.forEach((town) => {
        sum += town.bushfire[aspect] || 0;
        sum += town.flood[aspect] || 0;
        sum += town.stormSurge[aspect] || 0;
        sum += town.heatwave[aspect] || 0;
        sum += town.biohazard[aspect] || 0;
      });

      return {
        name: aspectLabels[index],
        value: sum,
      };
    });
  };

  // Prepare town summary data
  const prepareTownData = () => {
    return towns.map((town) => {
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
        <Paper sx={{ p: 1, boxShadow: 2 }}>
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

  return (
    <Grid container spacing={3}>
      {/* Aspects Summary Chart */}
      <Grid item xs={12} md={6}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            boxShadow: 2,
            height: 400,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Typography
            variant="h6"
            align="center"
            fontWeight="bold"
            gutterBottom
          >
            Aspects Summary
          </Typography>
          <Box sx={{ height: 330, width: "100%" }}>
            <ResponsiveContainer>
              <BarChart
                data={aspectData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  axisLine={{ strokeWidth: 1 }}
                  tickLine={{ strokeWidth: 1 }}
                />
                <YAxis
                  domain={[0, maxY]}
                  tick={{ fontSize: 12 }}
                  tickCount={6}
                  axisLine={{ strokeWidth: 1 }}
                  tickLine={{ strokeWidth: 1 }}
                />
                <Tooltip content={renderTooltip} />
                <Bar
                  dataKey="value"
                  name="Points"
                  fill={natureColor}
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  label={{ position: "top", fill: "#666", fontSize: 12 }}
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
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Typography
            variant="h6"
            align="center"
            fontWeight="bold"
            gutterBottom
          >
            Towns Summary
          </Typography>
          <Box sx={{ height: 330, width: "100%" }}>
            <ResponsiveContainer>
              <BarChart
                data={townData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  axisLine={{ strokeWidth: 1 }}
                  tickLine={{ strokeWidth: 1 }}
                />
                <YAxis
                  domain={[0, maxY]}
                  tick={{ fontSize: 12 }}
                  tickCount={6}
                  axisLine={{ strokeWidth: 1 }}
                  tickLine={{ strokeWidth: 1 }}
                />
                <Tooltip content={renderTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="nature"
                  name="Nature"
                  stackId="a"
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
                  fill={healthColor}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default BarChartsView;
