// src/components/Game/components/GameTabs.jsx
import React from "react";
import { Paper, Box, Tabs, Tab, Typography, useTheme } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import HistoryIcon from "@mui/icons-material/History";

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`game-tabpanel-${index}`}
      aria-labelledby={`game-tab-${index}`}
      style={{ padding: "16px 0" }}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

// A11y props for tabs
function a11yProps(index) {
  return {
    id: `game-tab-${index}`,
    "aria-controls": `game-tabpanel-${index}`,
  };
}

/**
 * Game Tabs component providing tab navigation for game views
 */
const GameTabs = ({ activeTab, onTabChange, children }) => {
  const theme = useTheme();

  return (
    <>
      <Paper
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: 2,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={onTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            bgcolor: theme.palette.background.paper,
            "& .MuiTab-root": {
              fontWeight: "bold",
              py: 2,
              textTransform: "none",
              fontSize: "1rem",
            },
          }}
        >
          <Tab
            icon={<DashboardIcon />}
            label="Dashboard"
            iconPosition="start"
            {...a11yProps(0)}
          />
          <Tab
            icon={<LocationCityIcon />}
            label="Town Details"
            iconPosition="start"
            {...a11yProps(1)}
          />
          <Tab
            icon={<HistoryIcon />}
            label="Game History"
            iconPosition="start"
            {...a11yProps(2)}
          />
        </Tabs>
      </Paper>

      {React.Children.map(children, (child, index) => (
        <TabPanel value={activeTab} index={index}>
          {child}
        </TabPanel>
      ))}
    </>
  );
};

export default GameTabs;
