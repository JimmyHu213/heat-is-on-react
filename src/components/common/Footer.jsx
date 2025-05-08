// src/components/common/Footer.jsx
import React from "react";
import { Box, Container, Typography, Grid, Link } from "@mui/material";

// Import logos
import cmsLogo from "../../assets/images/cms.png";
import cohLogo from "../../assets/images/coh.png";
import estLogo from "../../assets/images/est.png";
import utasLogo from "../../assets/images/utas.png";
import tasgov from "../../assets/images/tasgov.png";

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
          spacing={10}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          {[
            { src: cmsLogo, alt: "CMS Logo", url: "https://cms.org", size: 50 },
            {
              src: tasgov,
              alt: "TasGov Logo",
              url: "https://www.tas.gov.au",
              size: 60,
            },
            {
              src: cohLogo,
              alt: "COH Logo",
              url: "https://coh.org",
              size: 100,
            },
            { src: estLogo, alt: "EST Logo", url: "https://est.org", size: 60 },
            {
              src: utasLogo,
              alt: "UTAS Logo",
              url: "https://utas.edu.au",
              size: 60,
            },
          ].map((logo, index) => (
            <Grid item xs={6} sm={3} key={index} sx={{ textAlign: "center" }}>
              <Box
                component="img"
                src={logo.src}
                alt={logo.alt}
                sx={{
                  height: { xs: 40, sm: 50, md: logo.size },
                  maxWidth: "100%",
                  filter: "grayscale(20%)",
                  transition: "filter 0.3s, transform 0.3s",
                  "&:hover": {
                    filter: "grayscale(0%)",
                    transform: "scale(1.05)",
                  },
                }}
              />
            </Grid>
          ))}
        </Grid>

        <Typography variant="body2" color="text.secondary" align="center">
          The Heat Is On © {new Date().getFullYear()} | Climate Change
          Adaptation Game
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
