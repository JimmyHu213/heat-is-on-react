// src/components/Game/components/IntroVideo.jsx
import React, { useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { MEDIA_CONFIG } from "../../../constants/mediaConfig.js";

export default function IntroVideo({
  src = MEDIA_CONFIG.introVideo,
  onStartGame,
  loading = false,
}) {
  const [hidden, setHidden] = useState(false);
  const [failedUrl, setFailedUrl] = useState(null);

  if (!src) return null;

  return (
    <Box sx={{ my: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Workshop Introduction Video
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={hidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
            onClick={() => setHidden((prev) => !prev)}
          >
            {hidden ? "Show Video" : "Skip / Hide Video"}
          </Button>
          {onStartGame && (
            <Button
              size="small"
              variant="contained"
              color="secondary"
              startIcon={<PlayArrowIcon />}
              onClick={onStartGame}
              disabled={loading}
            >
              Start Game
            </Button>
          )}
        </Box>
      </Box>

      {!hidden &&
        (failedUrl === src ? (
          <Alert severity="info">
            The introduction video could not be loaded. You can still start the
            game.
          </Alert>
        ) : (
          <Box
            component="video"
            key={src}
            src={src}
            controls
            preload="metadata"
            aria-label="The Heat Is On introduction video"
            onError={() => setFailedUrl(src)}
            sx={{
              width: "100%",
              maxHeight: 420,
              bgcolor: "#111",
              borderRadius: 2,
              display: "block",
            }}
          />
        ))}
    </Box>
  );
}
