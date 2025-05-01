import React from "react";
import { Card, Box, Typography } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * A custom bar chart component that matches the Flutter implementation
 *
 * @param {Object} props
 * @param {Array} props.data - Array of data objects for the chart
 * @param {Array} props.xAxisLabels - Optional array of labels for the x-axis (if not in data)
 * @param {number} props.maxY - Maximum value for Y axis
 * @param {string} props.title - Title of the chart
 * @param {string} props.dataKey - The key in data objects to use for bar values
 * @param {string} props.barColor - Color for the bars
 */
const CustomBarChart = ({
  data,
  xAxisLabels,
  maxY = 100,
  title = "Overall",
  dataKey = "value",
  barColor = "#8884d8",
}) => {
  // If xAxisLabels are provided but not in the data, add them to the data
  const chartData =
    xAxisLabels && data.every((item) => !item.name)
      ? data.map((item, index) => ({ ...item, name: xAxisLabels[index] }))
      : data;

  // Calculate interval for Y axis grid lines and ticks
  const calculateInterval = (maxValue) => {
    if (maxValue <= 100) return 20;
    if (maxValue <= 500) return 100;
    if (maxValue <= 1000) return 200;
    return Math.round(maxValue / 5);
  };

  const interval = calculateInterval(maxY);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            background: "rgba(44, 66, 96, 0.9)",
            border: "1px solid #ccc",
            padding: 1,
            borderRadius: 1,
          }}
        >
          <Typography color="white" fontSize={14}>
            {label}
          </Typography>
          <Typography color="white" fontWeight="bold" fontSize={15}>
            {payload[0].value.toFixed(1)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card
      sx={{
        background: "#2c4260",
        borderRadius: 4,
        boxShadow: 4,
        height: "100%",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Typography color="white" fontSize={12} fontWeight="bold">
          {title}
        </Typography>

        <Box sx={{ height: 38 }} />

        <Box
          sx={{
            flexGrow: 1,
            width: "100%",
            minHeight: 250,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                horizontalPoints={Array.from(
                  { length: Math.ceil(maxY / interval) + 1 },
                  (_, i) => i * interval
                )}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "white", fontWeight: "bold", fontSize: 14 }}
                axisLine={{ stroke: "white" }}
                tickLine={{ stroke: "white" }}
                dy={8}
                height={38}
              />
              <YAxis
                domain={[0, maxY]}
                tick={{ fill: "white", fontWeight: "bold", fontSize: 14 }}
                axisLine={{ stroke: "white" }}
                tickLine={{ stroke: "white" }}
                interval={0}
                ticks={Array.from(
                  { length: Math.ceil(maxY / interval) + 1 },
                  (_, i) => i * interval
                )}
                width={40}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              <Bar
                dataKey={dataKey}
                fill={barColor}
                radius={[4, 4, 0, 0]}
                barSize={26}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Card>
  );
};

export default CustomBarChart;
