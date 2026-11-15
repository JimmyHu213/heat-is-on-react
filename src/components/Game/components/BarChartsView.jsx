// src/components/Game/components/BarChartsView.jsx
import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
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
import { neshAverages, overallResilience } from "../../../game/scores.js";

const BarChartsView = ({ towns }) => {
  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  // Filter out the comparison town for NESH Resilience Summary (5 active towns)
  const regularTowns = towns.filter((town) => !town.isComparisonTown);
  const neshTowns = regularTowns.length > 0 ? regularTowns : towns;

  // Prepare NESH Resilience Summary data (0-100% average across active towns)
  const prepareAspectData = () => {
    const aspectMeta = [
      { key: "nature", label: "Nature" },
      { key: "economy", label: "Economy" },
      { key: "society", label: "Society" },
      { key: "health", label: "Health" },
    ];

    return aspectMeta.map(({ key, label }) => {
      const avg =
        neshTowns.reduce((acc, town) => acc + (neshAverages(town)[key] || 0), 0) /
        neshTowns.length;
      const pct = Number(avg.toFixed(1));

      return {
        name: label,
        value: pct,
        natureValue: key === "nature" ? pct : 0,
        economyValue: key === "economy" ? pct : 0,
        societyValue: key === "society" ? pct : 0,
        healthValue: key === "health" ? pct : 0,
      };
    });
  };

  // Prepare Towns Resilience Summary data (0-100% stacked NESH contribution)
  const prepareTownData = () => {
    return towns.map((town) => {
      const nesh = neshAverages(town);
      const total = Number(overallResilience(town).toFixed(1));
      return {
        name: town.name,
        nature: Number((nesh.nature / 4).toFixed(1)),
        economy: Number((nesh.economy / 4).toFixed(1)),
        society: Number((nesh.society / 4).toFixed(1)),
        health: Number((nesh.health / 4).toFixed(1)),
        total,
      };
    });
  };

  const aspectData = prepareAspectData();
  const townData = prepareTownData();

  const renderTooltip = (props) => {
    const { active, payload, label } = props;

    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1, boxShadow: 2, bgcolor: primaryColorLight }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {label}
          </Typography>
          {payload
            .filter((entry) => entry.dataKey !== "total" && entry.value > 0)
            .map((entry, index) => (
              <Typography
                key={index}
                variant="body2"
                sx={{ color: "#fff", fontWeight: "bold" }}
              >
                {entry.name}: {entry.value}%
              </Typography>
            ))}
        </Paper>
      );
    }

    return null;
  };

  const renderCustomBarLabel = (props) => {
    const { x, y, width, value } = props;
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
        {value}%
      </text>
    );
  };

  const renderTotalLabel = (props) => {
    const { x, y, width, index } = props;
    const total = townData[index]?.total ?? 0;

    return (
      <text
        x={x + width / 2}
        y={y - 10}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="bold"
        fontSize="13"
        style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}
      >
        {total}%
      </text>
    );
  };

  return (
    <Grid container spacing={3} justifyContent="center" sx={{ my: 2 }}>
      {/* NESH Resilience Summary Chart */}
      <Grid item xs={12} md={6}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            boxShadow: 2,
            height: 400,
            width: "100%",
            minWidth: { sm: 480 },
            bgcolor: "#2c4260",
          }}
        >
          <Typography
            variant="h6"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "#fff" }}
          >
            NESH Resilience Summary
          </Typography>
          <Box sx={{ height: 330, width: "100%" }}>
            <ResponsiveContainer>
              <BarChart
                data={aspectData}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                barSize={38}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#fff", fontWeight: "bold" }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 12, fill: "#fff", fontWeight: "bold" }}
                  tickCount={6}
                />
                <Tooltip content={renderTooltip} />
                <Bar
                  dataKey="natureValue"
                  name="Nature"
                  stackId="nesh"
                  fill={natureColor}
                  radius={[4, 4, 0, 0]}
                  animationDuration={500}
                  label={renderCustomBarLabel}
                />
                <Bar
                  dataKey="economyValue"
                  name="Economy"
                  stackId="nesh"
                  fill={economyColor}
                  radius={[4, 4, 0, 0]}
                  animationDuration={600}
                  label={renderCustomBarLabel}
                />
                <Bar
                  dataKey="societyValue"
                  name="Society"
                  stackId="nesh"
                  fill={societyColor}
                  radius={[4, 4, 0, 0]}
                  animationDuration={700}
                  label={renderCustomBarLabel}
                />
                <Bar
                  dataKey="healthValue"
                  name="Health"
                  stackId="nesh"
                  fill={healthColor}
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  label={renderCustomBarLabel}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Towns Resilience Summary Chart */}
      <Grid item xs={12} md={6}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            boxShadow: 2,
            height: 400,
            width: "100%",
            minWidth: { sm: 480 },
            bgcolor: "#2c4260",
          }}
        >
          <Typography
            variant="h6"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "#fff" }}
          >
            Towns Resilience Summary
          </Typography>
          <Box sx={{ height: 330, width: "100%" }}>
            <ResponsiveContainer>
              <BarChart
                data={townData}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                barSize={38}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#fff", fontWeight: "bold" }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 12, fill: "#fff", fontWeight: "bold" }}
                  tickCount={6}
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
    </Grid>
  );
};

export default BarChartsView;
