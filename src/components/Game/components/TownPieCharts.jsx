// src/components/Game/components/TownPieCharts.jsx
import React from "react";
import { Box, Grid, Typography, useTheme } from "@mui/material";
import TownPieChart from "../../Charts/TownPieChart";

// SVG-based pie chart for better control
const TownPieCharts = ({ towns }) => {
  const theme = useTheme();

  const regularTowns = towns
    ? towns.filter((town) => !town.isComparisonTown)
    : [];

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

  return (
    <>
      {/* {aspectLegend} */}
      <Grid
        container
        spacing={3}
        sx={{ mb: 3, display: "flex", justifyContent: "space-evenly" }}
      >
        {towns.map((town) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={town.id}
            sx={{ display: "flex", justifyContent: "top" }}
          >
            <TownPieChart town={town} />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default TownPieCharts;
