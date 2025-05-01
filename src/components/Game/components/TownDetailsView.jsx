// src/components/Game/components/TownDetailsView.jsx
import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  LinearProgress,
  useTheme,
} from "@mui/material";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../../constants/palette";

// Icons for hazards
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment"; // Bushfire
import FloodIcon from "@mui/icons-material/Flood"; // Flood
import ThunderstormIcon from "@mui/icons-material/Thunderstorm"; // Storm Surge
import WbSunnyIcon from "@mui/icons-material/WbSunny"; // Heatwave
import BugReportIcon from "@mui/icons-material/BugReport"; // Biohazard

/**
 * Component to display detailed town information
 */
const TownDetailsView = ({ towns }) => {
  const theme = useTheme();

  // Define hazard types and their properties
  const hazardTypes = [
    {
      id: "bushfire",
      name: "Bushfire",
      color: bushfireColor1,
      icon: <LocalFireDepartmentIcon />,
    },
    { id: "flood", name: "Flood", color: floodColor1, icon: <FloodIcon /> },
    {
      id: "stormSurge",
      name: "Storm Surge",
      color: stormSurgeColor1,
      icon: <ThunderstormIcon />,
    },
    {
      id: "heatwave",
      name: "Heatwave",
      color: heatwaveColor1,
      icon: <WbSunnyIcon />,
    },
    {
      id: "biohazard",
      name: "Biohazard",
      color: biohazardColor1,
      icon: <BugReportIcon />,
    },
  ];

  // Define aspects
  const aspects = [
    { id: "nature", name: "Nature" },
    { id: "economy", name: "Economy" },
    { id: "society", name: "Society" },
    { id: "health", name: "Health" },
  ];

  // If no towns, return a message
  if (!towns || towns.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No town data available
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {towns.map((town) => (
        <Grid item xs={12} md={6} key={town.id}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: 3,
              overflow: "hidden",
              "&:hover": {
                boxShadow: 6,
              },
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.primary.main,
                py: 1.5,
                px: 2,
                color: "white",
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                {town.name}
              </Typography>
            </Box>

            <CardContent>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="body2">
                  <strong>ID:</strong> {town.id}
                </Typography>
                <Typography variant="body2">
                  <strong>Budget Points:</strong> {town.effortPoints}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Hazard Resilience Levels
              </Typography>

              {hazardTypes.map((hazard) => (
                <Box key={hazard.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Box sx={{ mr: 1, color: hazard.color }}>{hazard.icon}</Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {hazard.name}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    {aspects.map((aspect) => (
                      <Grid item xs={6} key={aspect.id}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" gutterBottom>
                            {aspect.name}: {town[hazard.id][aspect.id]}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={town[hazard.id][aspect.id]}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: "rgba(0,0,0,0.1)",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: hazard.color,
                                borderRadius: 4,
                              },
                            }}
                          />

                          {/* Warning indicator if value is below threshold */}
                          {town[hazard.id][aspect.id] <= 20 && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              Critical level! (-10 penalty to all)
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default TownDetailsView;
