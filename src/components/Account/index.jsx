import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert, Avatar, Box, Button, CircularProgress, Container, Divider, Paper,
  Stack, TextField, Typography,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useGame } from "../../contexts/GameContext";
import { getPlayerCount } from "../../game/options";
import { summarizeHosting } from "./activity";

const actionColor = "#245956";
const pictureTypes = ["image/jpeg", "image/png", "image/webp"];

async function resizeAvatar(file) {
  if (!pictureTypes.includes(file.type) || file.size > 8 * 1024 * 1024) {
    throw new Error("Choose a JPEG, PNG, or WebP image up to 8 MB.");
  }

  const image = await createImageBitmap(file).catch(() => {
    throw new Error("Could not open that image. Try another file.");
  });
  try {
    const side = Math.min(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(256, side);
    const context = canvas.getContext("2d");
    context.fillStyle = "#f6f8f5";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2,
      side, side, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    image.close();
  }
}

function ProfileForm() {
  const { currentUser, userProfile, updateProfile } = useAuth();
  const [name, setName] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const displayName = name ?? userProfile?.displayName ?? currentUser.displayName ?? "";
  const photoURL = photo ?? userProfile?.photoURL ?? currentUser.photoURL ?? "";

  async function choosePhoto(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setFeedback(null);
    try {
      setPhoto(await resizeAvatar(file));
    } catch (error) {
      setFeedback({ severity: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (busy || (name === null && photo === null)) return;
    setBusy(true);
    setFeedback(null);
    try {
      const changes = {};
      if (name !== null) changes.displayName = name.trim();
      if (photo !== null) changes.photoURL = photo;
      await updateProfile(changes);
      setName(null);
      setPhoto(null);
      setFeedback({ severity: "success", message: "Profile saved." });
    } catch {
      setFeedback({ severity: "error", message: "Could not save your profile. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack component="form" onSubmit={saveProfile} spacing={2}>
      <Typography component="h2" variant="h5">Profile</Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={photoURL || undefined} sx={{ width: 64, height: 64, bgcolor: actionColor }}>
          {(displayName || currentUser.email || "?").charAt(0).toUpperCase()}
        </Avatar>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button component="label" role={undefined} tabIndex={-1} variant="outlined" disabled={busy}
            sx={{ "&:focus-within": { outline: "2px solid #245956", outlineOffset: 2 } }}>
            {photoURL ? "Replace avatar" : "Upload avatar"}
            <Box component="input" type="file" aria-label="Choose avatar image" accept={pictureTypes.join(",")}
              disabled={busy} onChange={choosePhoto}
              sx={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }} />
          </Button>
          {photoURL && <Button disabled={busy} onClick={() => setPhoto("")}>Remove avatar</Button>}
        </Stack>
      </Stack>
      <TextField label="Display name" autoComplete="nickname" value={displayName} disabled={busy}
        onChange={(event) => setName(event.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} />
      <TextField label="Sign-in email" value={currentUser.email || ""} slotProps={{ input: { readOnly: true } }} />
      {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
      <Button type="submit" variant="contained" disabled={busy || (name === null && photo === null)}
        sx={{ alignSelf: "start", bgcolor: actionColor }}>Save profile</Button>
    </Stack>
  );
}

function PasswordForm() {
  const { currentUser, changePassword, resetPassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (password !== confirmation || password === current) {
      setFeedback({ severity: "error", message: password === current
        ? "Choose a password different from your current password."
        : "The new passwords do not match." });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await changePassword(current, password);
      setCurrent("");
      setPassword("");
      setConfirmation("");
      setFeedback({ severity: "success", message: "Password updated." });
    } catch (error) {
      const message = ["auth/wrong-password", "auth/invalid-credential", "auth/invalid-login-credentials"].includes(error.code)
        ? "The current password is incorrect."
        : ["auth/weak-password", "auth/password-does-not-meet-requirements"].includes(error.code)
          ? "Choose a stronger password."
          : "Could not update your password. Try again.";
      setFeedback({ severity: "error", message });
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    setBusy(true);
    setFeedback(null);
    try {
      await resetPassword(currentUser.email);
      setFeedback({ severity: "success", message: "Password reset email sent." });
    } catch {
      setFeedback({ severity: "error", message: "Could not send a reset email. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={2}>
      <Typography component="h2" variant="h5">Change password</Typography>
      <TextField label="Current password" type="password" autoComplete="current-password" required disabled={busy}
        value={current} onChange={(event) => setCurrent(event.target.value)} />
      <TextField label="New password" type="password" autoComplete="new-password" required disabled={busy}
        value={password} onChange={(event) => setPassword(event.target.value)}
        slotProps={{ htmlInput: { minLength: 6 } }} />
      <TextField label="Confirm new password" type="password" autoComplete="new-password" required disabled={busy}
        value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
      {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
      <Stack direction="row" gap={1} flexWrap="wrap">
        <Button type="submit" variant="contained" disabled={busy} sx={{ bgcolor: actionColor }}>Update password</Button>
        <Button onClick={sendReset} disabled={busy || !currentUser.email}>Forgot current password?</Button>
      </Stack>
    </Stack>
  );
}

function sessionDate(session) {
  const value = session.completedAt ?? session.createdAt;
  const date = value?.toDate?.() ?? new Date(value ?? NaN);
  return Number.isNaN(date.getTime()) ? null : date;
}

function HostingActivity() {
  const { loading, error, activeSessions, completedSessions } = useGame();
  const stats = summarizeHosting(activeSessions, completedSessions);
  const recent = [...activeSessions, ...completedSessions]
    .map((session) => ({ session, date: sessionDate(session) }))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, 5);

  return (
    <Stack spacing={2}>
      <Typography component="h2" variant="h5">Hosting activity</Typography>
      {loading ? <CircularProgress aria-label="Loading hosting activity" size={28} /> : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 2, m: 0 }}>
            {[
              ["Saved games", stats.total],
              ["In progress", stats.active],
              ["Finished", stats.finished],
              ["Participant attendances", stats.attendances ?? "Unavailable"],
            ].map(([label, count]) => (
              <Box key={label} sx={{ bgcolor: "#edf3ef", p: 1.5, borderRadius: 1 }}>
                <Typography component="dt" variant="body2">{label}</Typography>
                <Typography component="dd" variant="h6" sx={{ m: 0 }}>{count}</Typography>
              </Box>
            ))}
          </Box>
          {stats.missing > 0 && (
            <Typography variant="body2" color="text.secondary">
              Finished games without a recorded player count: {stats.missing}.
            </Typography>
          )}
          <Typography component="h3" variant="h6">Recent games</Typography>
          {!recent.length && <Typography color="text.secondary">No saved games yet.</Typography>}
          {recent.map(({ session, date }) => (
            <Stack key={session.id} direction="row" gap={1} justifyContent="space-between"
              alignItems="center" sx={{ borderTop: "1px solid #dce5df", pt: 1.5 }}>
              <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <Typography fontWeight={600}>{session.name || "Untitled Game"}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {[
                    date?.toLocaleDateString(),
                    session.isActive ? "In progress" : session.endedEarly ? "Ended early" : "Completed",
                    getPlayerCount(session) === null ? "Player count unavailable" : getPlayerCount(session) + " players",
                  ].filter(Boolean).join(" · ")}
                </Typography>
              </Box>
              <Button component={RouterLink} to={"/game/" + session.id}>View</Button>
            </Stack>
          ))}
        </>
      )}
    </Stack>
  );
}

export default function Account() {
  return (
    <Box component="main" sx={{ bgcolor: "#f6f8f5", color: "#172e2c", flex: 1 }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Button component={RouterLink} to="/" sx={{ mb: 1, color: actionColor }}>Back to Dashboard</Button>
        <Typography component="h1" variant="h4" fontWeight={700} sx={{ mb: 3 }}>Manage account</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1.25fr)" }, gap: 3, alignItems: "start" }}>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={3} divider={<Divider />}>
              <ProfileForm />
              <PasswordForm />
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><HostingActivity /></Paper>
        </Box>
      </Container>
    </Box>
  );
}
