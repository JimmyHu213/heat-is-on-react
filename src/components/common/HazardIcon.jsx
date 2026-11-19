// src/components/common/HazardIcon.jsx
import React, { useState } from "react";
import { Box } from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import FloodIcon from "@mui/icons-material/Flood";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import BugReportIcon from "@mui/icons-material/BugReport";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import {
  bushfireColor1,
  floodColor1,
  stormSurgeColor1,
  heatwaveColor1,
  biohazardColor1,
} from "../../constants/palette";
import { getHazardIconPath } from "../../constants/mediaConfig.js";

const FALLBACK_ICONS = {
  bushfire: LocalFireDepartmentIcon,
  flood: FloodIcon,
  stormSurge: ThunderstormIcon,
  heatwave: WbSunnyIcon,
  biohazard: BugReportIcon,
  mystery: QuestionMarkIcon,
};

const FALLBACK_COLORS = {
  bushfire: bushfireColor1,
  flood: floodColor1,
  stormSurge: stormSurgeColor1,
  heatwave: heatwaveColor1,
  biohazard: biohazardColor1,
};

export default function HazardIcon({ hazardId, color, size = 24, sx }) {
  const iconUrl = getHazardIconPath(hazardId);
  const [failedUrl, setFailedUrl] = useState(null);
  const resolvedColor = color || FALLBACK_COLORS[hazardId] || "inherit";
  const FallbackIcon = FALLBACK_ICONS[hazardId];

  if (iconUrl && failedUrl !== iconUrl) {
    return (
      <Box
        component="img"
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        onError={() => setFailedUrl(iconUrl)}
        sx={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "inline-block",
          verticalAlign: "middle",
          flexShrink: 0,
          ...sx,
        }}
      />
    );
  }

  return FallbackIcon ? (
    <FallbackIcon sx={{ color: resolvedColor, fontSize: size, ...sx }} />
  ) : null;
}
