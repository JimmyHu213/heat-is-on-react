// src/components/common/Footer.jsx
import React, { useState } from "react";
import { Box, Container, Typography, Chip } from "@mui/material";
import { useLocation } from "react-router-dom";
import { MEDIA_CONFIG } from "../../constants/mediaConfig";
import "./Footer.css";

// Import logos
import cmsLogo from "../../assets/images/cms.png";
import cohLogo from "../../assets/images/coh.png";
import estLogo from "../../assets/images/est.png";
import tasgov from "../../assets/images/tasgov.png";

const logos = [
  { src: MEDIA_CONFIG.inspiringTasmaniaLogo, alt: "Inspiring Tasmania", artHeight: 0.59 },
  { src: MEDIA_CONFIG.utasLogo, alt: "University of Tasmania" },
  { src: cmsLogo, alt: "CMS" },
  { src: tasgov, alt: "Tasmanian Government" },
  { src: cohLogo, alt: "City of Hobart", artHeight: 0.53 },
  { src: estLogo, alt: "EST", artHeight: 0.85 },
];

const LogoItem = ({ src, alt, artHeight = 1 }) => {
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
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      sx={{
        // Compensate for whitespace embedded in the logo artwork.
        height: `calc(var(--partner-art-height) / ${artHeight})`,
        maxWidth: "100%",
        objectFit: "contain",
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
        ) : (
          <div className="footer-partners" aria-label="Project partners" role="region">
            <ul className="footer-logo-group">
              {logos.map((logo) => (
                <li key={logo.alt}><LogoItem {...logo} /></li>
              ))}
            </ul>
          </div>
        )}

        <Typography variant="body2" color="text.secondary" align="center">
          {MEDIA_CONFIG.copyrightText} · {new Date().getFullYear()}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
