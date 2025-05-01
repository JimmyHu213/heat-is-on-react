// import React from "react";
// import { Grid, Box, Container, Typography } from "@mui/material";
// import RadialHazardChart from "../Charts/PieChart";

// const TownHazardView = () => {
//   // Sample data for two towns matching your screenshot
//   const mershamData = [
//     // Biohazard section (purple, top left)
//     { name: "N", hazardType: "biohazard", value: 100 },
//     { name: "E", hazardType: "biohazard", value: 75 },
//     { name: "S", hazardType: "biohazard", value: 75 },
//     { name: "H", hazardType: "biohazard", value: 90 },

//     // Bushfire section (orange, top right)
//     { name: "N", hazardType: "bushfire", value: 100 },
//     { name: "E", hazardType: "bushfire", value: 80 },
//     { name: "S", hazardType: "bushfire", value: 80 },
//     { name: "H", hazardType: "bushfire", value: 95 },

//     // Storm section (blue, right)
//     { name: "N", hazardType: "storm", value: 55 },
//     { name: "E", hazardType: "storm", value: 70 },
//     { name: "S", hazardType: "storm", value: 80 },
//     { name: "H", hazardType: "storm", value: 85 },

//     // Flood section (teal, bottom)
//     { name: "N", hazardType: "flood", value: 95 },
//     { name: "E", hazardType: "flood", value: 80 },
//     { name: "S", hazardType: "flood", value: 80 },
//     { name: "H", hazardType: "flood", value: 95 },

//     // Heatwave section (red, left)
//     { name: "N", hazardType: "heatwave", value: 75 },
//     { name: "E", hazardType: "heatwave", value: 75 },
//     { name: "S", hazardType: "heatwave", value: 75 },
//     { name: "H", hazardType: "heatwave", value: 85 },
//   ];

//   const yinglunaData = [
//     // Biohazard section (purple, top left)
//     { name: "N", hazardType: "biohazard", value: 75 },
//     { name: "E", hazardType: "biohazard", value: 90 },
//     { name: "S", hazardType: "biohazard", value: 75 },
//     { name: "H", hazardType: "biohazard", value: 90 },

//     // Bushfire section (orange, top right)
//     { name: "N", hazardType: "bushfire", value: 80 },
//     { name: "E", hazardType: "bushfire", value: 95 },
//     { name: "S", hazardType: "bushfire", value: 80 },
//     { name: "H", hazardType: "bushfire", value: 95 },

//     // Storm section (blue, right)
//     { name: "N", hazardType: "storm", value: 60 },
//     { name: "E", hazardType: "storm", value: 65 },
//     { name: "S", hazardType: "storm", value: 65 },
//     { name: "H", hazardType: "storm", value: 80 },

//     // Flood section (teal, bottom)
//     { name: "N", hazardType: "flood", value: 100 },
//     { name: "E", hazardType: "flood", value: 100 },
//     { name: "S", hazardType: "flood", value: 80 },
//     { name: "H", hazardType: "flood", value: 95 },

//     // Heatwave section (red, left)
//     { name: "N", hazardType: "heatwave", value: 90 },
//     { name: "E", hazardType: "heatwave", value: 70 },
//     { name: "S", hazardType: "heatwave", value: 75 },
//     { name: "H", hazardType: "heatwave", value: 85 },
//   ];

//   return (
//     <Container>
//       <Box sx={{ my: 4 }}>
//         <Typography variant="h4" gutterBottom>
//           Town Hazard Overview
//         </Typography>
//         <Typography variant="body1" paragraph>
//           Each town's hazard profile is displayed with the following categories:
//         </Typography>
//         <Grid container spacing={2} mb={2}>
//           <Grid item>
//             <Typography variant="body2">
//               <strong>N</strong> - Natural Features
//             </Typography>
//           </Grid>
//           <Grid item>
//             <Typography variant="body2">
//               <strong>E</strong> - Environment
//             </Typography>
//           </Grid>
//           <Grid item>
//             <Typography variant="body2">
//               <strong>S</strong> - Services
//             </Typography>
//           </Grid>
//           <Grid item>
//             <Typography variant="body2">
//               <strong>H</strong> - Housing
//             </Typography>
//           </Grid>
//         </Grid>
//       </Box>

//       <Grid container spacing={3} justifyContent="center">
//         <Grid item>
//           <RadialHazardChart
//             data={mershamData}
//             townName="Mersham"
//             townColor="#3E7D4F"
//           />
//         </Grid>
//         <Grid item>
//           <RadialHazardChart
//             data={yinglunaData}
//             townName="Yingluna"
//             townColor="#3E7D4F"
//           />
//         </Grid>
//       </Grid>
//     </Container>
//   );
// };

// export default TownHazardView;

import React from "react";
import { Grid, Box, Container, Typography } from "@mui/material";
import CustomBarChart from "../Charts/BarChart";

const BarChartExample = () => {
  // Sample data
  const townScores = [
    { name: "Mersham", value: 85 },
    { name: "Yingluna", value: 92 },
    { name: "Riverdale", value: 78 },
    { name: "Westfield", value: 65 },
  ];

  const hazardData = [
    { name: "Bushfire", value: 95 },
    { name: "Flood", value: 80 },
    { name: "Storm", value: 75 },
    { name: "Heatwave", value: 85 },
    { name: "Biohazard", value: 65 },
  ];

  // Sample data without names (using xAxisLabels instead)
  const monthlyData = [
    { value: 42 },
    { value: 63 },
    { value: 28 },
    { value: 35 },
    { value: 50 },
    { value: 75 },
  ];
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Performance Metrics
        </Typography>
        <Typography variant="body1" paragraph>
          These charts show various performance metrics for our towns and hazard
          types.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 400 }}>
            <CustomBarChart
              data={townScores}
              maxY={100}
              title="Town Preparedness Scores"
              barColor="#3F51B5"
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ height: 400 }}>
            <CustomBarChart
              data={hazardData}
              maxY={100}
              title="Hazard Impact Levels"
              barColor="#FF5722"
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ height: 400 }}>
            <CustomBarChart
              data={monthlyData}
              xAxisLabels={monthLabels}
              maxY={80}
              title="Monthly Incident Reports"
              barColor="#4CAF50"
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BarChartExample;
