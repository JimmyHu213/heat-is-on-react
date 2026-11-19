import { Button, Container, Stack, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getValidTrainingUrl } from "../../constants/mediaConfig";

export default function CcsAccess({ handoffUid }) {
  const { currentUser } = useAuth();
  if (handoffUid && currentUser?.uid === handoffUid) return <Navigate to="/" replace />;
  const courseUrl = getValidTrainingUrl(import.meta.env.VITE_CCS_COURSE_URL)
    || getValidTrainingUrl(import.meta.env.VITE_TRAINING_COURSE_URL)
    || (import.meta.env.VITE_FIREBASE_PROJECT_ID === "heat-is-on" ? "https://backup.curiousclimate.org.au/" : "");
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h4" component="h1">Sign in through CCS</Typography>
        <Typography>Open your Heat Is On course and select Go to dashboard for a fresh sign-in link.</Typography>
        {courseUrl && <Button variant="contained" href={courseUrl}>Return to CCS</Button>}
      </Stack>
    </Container>
  );
}
