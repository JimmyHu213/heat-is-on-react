import React, { useState } from "react";
import { Box } from "@mui/material";
import HazardIcon from "../../common/HazardIcon";
import { MEDIA_CONFIG, getEventGifPath } from "../../../constants/mediaConfig.js";

export default function HazardMedia({ hazard, introduction = false, sx }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const src = introduction
    ? MEDIA_CONFIG.hazardIntroductions[hazard.id]
    : getEventGifPath(hazard.id);

  return (
    <Box sx={{ aspectRatio: "16 / 9", display: "flex", alignItems: "center", justifyContent: "center", ...sx }}>
      {src && failedUrl !== src ? (
        <Box
          component="img"
          key={src}
          src={src}
          alt={`${hazard.name} ${introduction ? "introduction" : "event animation"}`}
          loading={introduction ? "lazy" : "eager"}
          onError={() => setFailedUrl(src)}
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : <HazardIcon hazardId={hazard.id} size={64} />}
    </Box>
  );
}
