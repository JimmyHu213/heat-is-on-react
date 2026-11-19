import React, { useState } from "react";
import { Box } from "@mui/material";
import HazardIcon from "../../common/HazardIcon";
import { MEDIA_CONFIG, getEventGifPath } from "../../../constants/mediaConfig.js";

export default function HazardMedia({ hazard, introduction = false, sx }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const src = introduction
    ? MEDIA_CONFIG.hazardIntroductions[hazard.id]
    : getEventGifPath(hazard.id);

  const optimized = !introduction ? MEDIA_CONFIG.eventAnimations[hazard.id] : null;

  return (
    <Box sx={{ aspectRatio: "16 / 9", display: "flex", alignItems: "center", justifyContent: "center", ...sx }}>
      {src && failedUrl !== src ? (
        <Box component="picture" key={src} sx={{ display: "block", width: "100%", height: "100%" }}>
          {optimized && <source srcSet={optimized} type="image/webp" />}
          <Box
            component="img"
            src={src}
            alt={`${hazard.name} ${introduction ? "introduction" : "event animation"}`}
            loading={introduction ? "lazy" : "eager"}
            fetchPriority={introduction ? undefined : "high"}
            onError={() => setFailedUrl(src)}
            sx={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
          />
        </Box>
      ) : <HazardIcon hazardId={hazard.id} size={64} />}
    </Box>
  );
}
