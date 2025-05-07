// src/components/common/Footer.jsx
import React from "react";
import { Box, Container, Typography, Grid, Link } from "@mui/material";

// Import logos
import cmsLogo from "../../assets/images/cms.png";
import cohLogo from "../../assets/images/coh.png";
import estLogo from "../../assets/images/est.png";
import utasLogo from "../../assets/images/utas.png";

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
        <Typography
          variant="subtitle1"
          align="center"
          gutterBottom
          fontWeight="bold"
        >
          With Special Thanks to Our Sponsors
        </Typography>

        <Grid
          container
          spacing={20}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          {[
            { src: cmsLogo, alt: "CMS Logo", url: "https://cms.org" },
            { src: cohLogo, alt: "COH Logo", url: "https://coh.org" },
            { src: estLogo, alt: "EST Logo", url: "https://est.org" },
            { src: utasLogo, alt: "UTAS Logo", url: "https://utas.edu.au" },
          ].map((logo, index) => (
            <Grid item xs={6} sm={3} key={index} sx={{ textAlign: "center" }}>
              <Box
                component="img"
                src={logo.src}
                alt={logo.alt}
                sx={{
                  height: { xs: 40, sm: 50, md: 60 },
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
