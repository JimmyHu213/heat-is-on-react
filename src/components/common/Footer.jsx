// src/components/common/Footer.jsx
import React, { useState } from "react";
import { Box, Container, Typography, Grid, Chip } from "@mui/material";
import { MEDIA_CONFIG } from "../../constants/mediaConfig";

// Import logos
import cmsLogo from "../../assets/images/cms.png";
import cohLogo from "../../assets/images/coh.png";
import estLogo from "../../assets/images/est.png";
import utasLogo from "../../assets/images/utas.png";
import tasgov from "../../assets/images/tasgov.png";

const LogoItem = ({ src, alt, size }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <Chip
        label={alt}
        variant="outlined"
        size="small"
        sx={{ color: "text.secondary" }}
      />
    );
  }
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      sx={{
        height: { xs: 40, sm: 50, md: size },
        maxWidth: "100%",
        filter: "grayscale(20%)",
        transition: "filter 0.3s, transform 0.3s",
        "&:hover": {
          filter: "grayscale(0%)",
          transform: "scale(1.05)",
        },
      }}
    />
  );
};

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#fff",
        py: 3,
        mt: "auto",
        borderTop: "1px solid #e0e0e0",
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={6}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          {[
            { src: MEDIA_CONFIG.inspiringTasmaniaLogo, alt: "Inspiring Tasmania Logo", size: 60 },
            { src: utasLogo || MEDIA_CONFIG.utasLogo, alt: "UTAS Logo", size: 60 },
            { src: cmsLogo, alt: "CMS Logo", size: 50 },
            { src: tasgov, alt: "TasGov Logo", size: 60 },
            { src: cohLogo, alt: "COH Logo", size: 100 },
            { src: estLogo, alt: "EST Logo", size: 60 },
          ].map((logo, index) => (
            <Grid item xs={6} sm={4} md={2} key={index} sx={{ textAlign: "center" }}>
              <LogoItem src={logo.src} alt={logo.alt} size={logo.size} />
            </Grid>
          ))}
        </Grid>

        <Typography variant="body2" color="text.secondary" align="center">
          {MEDIA_CONFIG.copyrightText} · {new Date().getFullYear()}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
