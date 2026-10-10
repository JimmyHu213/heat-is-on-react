import { t } from '../../i18n';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, Chip, CircularProgress, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../contexts/AuthContext';
import { getSubscriptionRequest, submitSubscriptionRequest } from '../../services/subscriptionService';
import TrainingLink from '../common/TrainingLink';

export default function Subscription() {
  const { currentUser, userProfile } = useAuth();
  const [fields, setFields] = useState({ name: userProfile?.displayName || '', organization: '', message: '' });
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError(''); setLoadError(false);
    try { setRequest(await getSubscriptionRequest(currentUser.uid)); }
    catch { setLoadError(true); setError('Could not load your application. Please retry.'); }
    finally { setLoading(false); }
  }, [currentUser.uid]);
  useEffect(() => { load(); }, [load]);
  const submit = async event => {
    event.preventDefault(); if (sending) return;
    setSending(true); setError('');
    try { setRequest(await submitSubscriptionRequest(currentUser, fields)); }
    catch { setError('Could not submit your application. Your details are still here; please retry.'); }
    finally { setSending(false); }
  };
  return <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 }, flexGrow: 1 }}>
    <Button component={Link} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>{t("Back to games")}</Button>
    <Paper sx={{ p: { xs: 3, md: 5 }, bgcolor: 'primary.main', color: '#fff', mb: 3 }}>
      <Typography variant="overline">{t("THE HEAT IS ON · SUBSCRIPTIONS")}</Typography>
      <Typography variant="h3" sx={{ my: 2 }}>{t("Bring resilience into your community.")}</Typography>
      <Typography>{t("Register your interest in using the dashboard for teaching, training or facilitated workshops.")}</Typography>
    </Paper>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
      <Paper sx={{ p: 3 }}>
        {loading ? <CircularProgress aria-label={t("Loading application")} /> : error && !request ? <Alert severity="error" action={loadError ? <Button onClick={load}>{t("Retry")}</Button> : undefined}>{t(error)}</Alert> : null}
        {!loading && request ? <Stack spacing={2}>
          <Chip label={request.status === 'pending' ? t("Application received") : t("Application being reviewed")} color="success" sx={{ alignSelf: 'start' }} />
          <Typography variant="h5">{t("Thanks, ")}{request.name}.</Typography>
          <Typography>{t("Your subscription request is saved. There is no payment or charge at this stage.")}</Typography>
          <Typography color="text.secondary">{request.organization} · {request.email}</Typography>
          <Typography variant="body2">{t("You can return to this page to view your application status.")}</Typography>
        </Stack> : !loading && !loadError && <Box component="form" onSubmit={submit}>
          <Typography variant="h5" gutterBottom>{t("Subscription application")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t("No payment details required.")}</Typography>
          <TextField required fullWidth margin="normal" label={t("Your name")} value={fields.name} inputProps={{ maxLength: 100 }} onChange={e => setFields({ ...fields, name: e.target.value })} />
          <TextField fullWidth margin="normal" label={t("Email address")} value={currentUser.email} slotProps={{ input: { readOnly: true } }} />
          <TextField required fullWidth margin="normal" label={t("Organization")} value={fields.organization} inputProps={{ maxLength: 200 }} onChange={e => setFields({ ...fields, organization: e.target.value })} />
          <TextField fullWidth multiline rows={3} margin="normal" label={t("How would you like to use the dashboard?")} value={fields.message} inputProps={{ maxLength: 1000 }} onChange={e => setFields({ ...fields, message: e.target.value })} />
          <Button type="submit" fullWidth variant="contained" disabled={sending || !fields.name.trim() || !fields.organization.trim()} sx={{ mt: 2 }}>{sending ? t("Submitting…") : t("Submit application")}</Button>
        </Box>}
      </Paper>
      <Paper sx={{ p: 3, alignSelf: 'start' }}><Typography variant="h6" gutterBottom>{t("Prepare to facilitate")}</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>{t("Training resources will help you introduce the game and guide your group through each round.")}</Typography><TrainingLink /></Paper>
    </Box>
  </Container>;
}
