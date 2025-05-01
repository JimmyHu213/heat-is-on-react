import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
  CssBaseline,
  CircularProgress,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import TableChartIcon from "@mui/icons-material/TableChart";
import { primaryColor } from "../../constants/palette";
import { useNavigate } from "react-router-dom";

// Import your context providers here (equivalent to your Provider in Flutter)
// import { useTownModel } from '../contexts/TownContext';
// import { useTownLogModel } from '../contexts/TownLogContext';

const drawerWidth = 240;

const LayoutTemplate = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  // Initialize data on component mount (similar to initState in Flutter)
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          initializeTowns(),
          initializeEvents(),
          initializeRounds(),
          initializeDummy(),
        ]);

        // Set loading to false when all initialization is complete
        setIsLoading(false);
      } catch (error) {
        console.error("Error during initialization:", error);
        setLoadingMessage("Error initializing data. Please try again.");
      }
    };

    initializeData();
  }, []);

  // These functions would call your API or data services
  const initializeTowns = async () => {
    try {
      // Replace with your actual API calls or data fetching logic
      console.log("Initializing towns...");
      // Example: await yourTownService.fetchTowns();
      return true;
    } catch (error) {
      console.error("Error initializing towns:", error);
      throw error;
    }
  };

  const initializeEvents = async () => {
    try {
      console.log("Initializing events...");
      // Example: await yourEventService.fetchEvents();
      return true;
    } catch (error) {
      console.error("Error initializing events:", error);
      throw error;
    }
  };

  const initializeRounds = async () => {
    try {
      console.log("Initializing rounds...");
      // Example: await yourRoundService.fetchRounds();
      return true;
    } catch (error) {
      console.error("Error initializing rounds:", error);
      throw error;
    }
  };

  const initializeDummy = async () => {
    try {
      console.log("Initializing dummy data...");
      // Example: await yourDummyService.fetchDummyData();
      return true;
    } catch (error) {
      console.error("Error initializing dummy data:", error);
      throw error;
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      onClick: () => navigate("/"),
    },
    {
      text: "Bar Charts",
      icon: <BarChartIcon />,
      onClick: () => navigate("/bar-charts"),
    },
    {
      text: "Pie Charts",
      icon: <PieChartIcon />,
      onClick: () => navigate("/pie-charts"),
    },
    {
      text: "Table View",
      icon: <TableChartIcon />,
      onClick: () => navigate("/table"),
    },
    {
      text: "Information",
      icon: <InfoOutlinedIcon />,
      onClick: () => navigate("/intro"),
    },
    {
      text: "Admin Control",
      icon: <PersonOutlineOutlinedIcon />,
      onClick: () => navigate("/control"),
    },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ backgroundColor: primaryColor }}>
        <Typography variant="h6" noWrap component="div" color="white">
          Heat Is On
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) => (
          <ListItem button key={item.text} onClick={item.onClick}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: primaryColor,
        }}
      >
        <CircularProgress color="primary" />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            color: "white",
          }}
        >
          {loadingMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: primaryColor,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src="/assets/images/web-banner.png"
            alt="Banner"
            sx={{
              height: 64,
              display: { xs: "none", md: "block" },
            }}
          />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: "block", md: "none" } }}
          >
            Heat Is On
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: "64px", // Height of the AppBar
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default LayoutTemplate;
