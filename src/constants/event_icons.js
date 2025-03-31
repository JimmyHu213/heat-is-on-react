import React from "react";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import CloudIcon from "@mui/icons-material/Cloud";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm"; // Close equivalent to cloudy_snowing
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import BugReportIcon from "@mui/icons-material/BugReport";

// Import the color values from your colors file
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "./palette";

// Define the event icons object with React components
export const eventIcons = {
  bushfire: (
    <LocalFireDepartmentIcon sx={{ color: bushfireColor1, fontSize: 36 }} />
  ),
  flood: <CloudIcon sx={{ color: floodColor1, fontSize: 36 }} />,
  stormSurge: (
    <ThunderstormIcon sx={{ color: stormSurgeColor1, fontSize: 36 }} />
  ),
  heatwave: <WbSunnyIcon sx={{ color: heatwaveColor1, fontSize: 36 }} />,
  biohazard: <BugReportIcon sx={{ color: biohazardColor1, fontSize: 36 }} />,
};

// Alternative approach using a function to generate icons dynamically
export const getEventIcon = (eventType) => {
  switch (eventType) {
    case "bushfire":
      return (
        <LocalFireDepartmentIcon sx={{ color: bushfireColor1, fontSize: 36 }} />
      );
    case "flood":
      return <CloudIcon sx={{ color: floodColor1, fontSize: 36 }} />;
    case "stormSurge":
      return (
        <ThunderstormIcon sx={{ color: stormSurgeColor1, fontSize: 36 }} />
      );
    case "heatwave":
      return <WbSunnyIcon sx={{ color: heatwaveColor1, fontSize: 36 }} />;
    case "biohazard":
      return <BugReportIcon sx={{ color: biohazardColor1, fontSize: 36 }} />;
    default:
      return null;
  }
};
