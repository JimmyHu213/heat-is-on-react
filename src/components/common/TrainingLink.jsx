// src/components/common/TrainingLink.jsx
import React from "react";
import { Button } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import {
  MEDIA_CONFIG,
  getValidTrainingUrl,
} from "../../constants/mediaConfig.js";

export default function TrainingLink({
  url = MEDIA_CONFIG.trainingCourseUrl,
  variant = "outlined",
  color = "primary",
  size = "medium",
  fullWidth = false,
  sx,
}) {
  const validUrl = getValidTrainingUrl(url);
  if (!validUrl) return null;

  return (
    <Button
      component="a"
      href={validUrl}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      startIcon={<SchoolIcon />}
      sx={sx}
    >
      Training Course
    </Button>
  );
}
