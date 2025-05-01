import { Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";

export default function StandardIconButton({ icon, onClick, color, size }) {
  return (
    <IconButton
      variant="contained"
      size={size}
      onClick={onClick}
      sx={{
        backgroundColor: color,
        padding: "10px 20px",
        borderRadius: "5px",
        fontSize: "16px",
        fontWeight: "bold",
        textTransform: "uppercase",
        "&:hover": {
          backgroundColor: color,
          opacity: 0.8,
        },
      }}
    >
      {icon}
    </IconButton>
  );
}
