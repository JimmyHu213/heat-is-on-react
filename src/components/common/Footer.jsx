// src/components/common/Footer.jsx
import React, { useState } from "react";
import { Box, Container, Typography, Grid, Chip } from "@mui/material";
import { useLocation } from "react-router-dom";
import { MEDIA_CONFIG } from "../../constants/mediaConfig";
import "./Footer.css";

// Import logos
import cmsLogo from "../../assets/images/cms.png";
import cohLogo from "../../assets/images/coh.png";
import estLogo from "../../assets/images/est.png";
import utasLogo from "../../assets/images/utas.png";
import tasgov from "../../assets/images/tasgov.png";

const logos = [
  { src: MEDIA_CONFIG.inspiringTasmaniaLogo, alt: "Inspiring Tasmania", size: 60 },
  { src: utasLogo, alt: "University of Tasmania", size: 60 },
  { src: cmsLogo, alt: "CMS", size: 50 },
  { src: tasgov, alt: "Tasmanian Government", size: 60 },
  { src: cohLogo, alt: "City of Hobart", size: 100 },
  { src: estLogo, alt: "EST", size: 60 },
];

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
  const { pathname } = useLocation();
  const showCarousel = /^\/login\/?$/i.test(pathname);

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
        {showCarousel ? (
          <div className="footer-partners" aria-label="Project partners" role="region">
            <div className="footer-logo-viewport">
              <div className="footer-logo-track">
                {[false, true].map((duplicate) => (
                  <ul className="footer-logo-group" key={String(duplicate)} aria-hidden={duplicate || undefined}>
                    {logos.map((logo) => (
                      <li key={logo.alt}><LogoItem {...logo} /></li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        ) : <Grid
          container
          spacing={6}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          {logos.map((logo) => (
            <Grid item xs={6} sm={4} md={2} key={logo.alt} sx={{ textAlign: "center" }}>
              <LogoItem {...logo} />
            </Grid>
          ))}
        </Grid>}

        <Typography variant="body2" color="text.secondary" align="center">
          {MEDIA_CONFIG.copyrightText} · {new Date().getFullYear()}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
