import { ButtonBase, Button } from "@mui/material";
import React from "react";

export default function StandardButton({ color, children, size, onClick }) {
  return (
    <Button
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
      {children}
    </Button>
  );
}
