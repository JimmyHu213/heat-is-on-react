import { t, useLanguage } from '../../../i18n';
import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Link, TextField, Typography } from '@mui/material';
import { usePresentation, mediaUrl } from '../../../contexts/PresentationContext';
import { hazards } from '../../../constants/hazards';
import { BUILT_IN_MEDIA } from '../../../constants/presentation';
import HazardIcon from '../../common/HazardIcon';

export function MediaSettings({ open, onClose }) {
  const { media, saveMedia, resetMedia } = usePresentation();
  const [draft, setDraft] = useState(media);
  const [error, setError] = useState('');
  const save = () => {
    const urls = [draft.introVideo, draft.introVideoEn, ...Object.values(draft.eventGifs), ...Object.values(draft.hazardIcons)];
    if (urls.some(url => url.trim() && !mediaUrl(url))) {
      setError('Use an HTTPS URL or a path beginning with /.'); return;
    }
    try { saveMedia(draft); onClose(); } catch { setError('Your browser could not save these settings.'); }
  };
  const update = (category, id, value) => setDraft(prev => ({ ...prev,
    [category]: { ...prev[category], [id]: value } }));
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>{t("Presentation media")}</DialogTitle>
    <DialogContent>
      <Typography variant="body2" sx={{ mb: 2 }}>{t("Add the introduction video, event GIFs and designer icons. These choices are saved in this browser.")}</Typography>
      {error && <Alert severity="error">{t(error)}</Alert>}
      <TextField fullWidth margin="normal" label={t("Introduction video URL (Chinese)")} value={draft.introVideo}
        helperText={t("Direct video file URL (MP4 or WebM)")} onChange={e => setDraft({ ...draft, introVideo: e.target.value })} />
      <TextField fullWidth margin="normal" label={t("Introduction video URL (English)")} value={draft.introVideoEn}
        helperText={t("Direct video file URL (MP4 or WebM)")} onChange={e => setDraft({ ...draft, introVideoEn: e.target.value })} />
      {hazards.map(hazard => <Box key={hazard.id} sx={{ mt: 2 }}>
        <Typography fontWeight="bold">{t(hazard.name)}</Typography>
        <TextField fullWidth margin="dense" label={t("{0} GIF URL", [t(hazard.name)])} value={draft.eventGifs[hazard.id] || ''}
          onChange={e => update('eventGifs', hazard.id, e.target.value)} />
        <TextField fullWidth margin="dense" label={t("{0} icon URL", [t(hazard.name)])} value={draft.hazardIcons[hazard.id] || ''}
          onChange={e => update('hazardIcons', hazard.id, e.target.value)} />
      </Box>)}
    </DialogContent>
    <DialogActions>
      <Button onClick={() => { resetMedia(); onClose(); }}>{t("Use project defaults")}</Button>
      <Button onClick={onClose}>{t("Cancel")}</Button><Button variant="contained" onClick={save}>{t("Save media")}</Button>
    </DialogActions>
  </Dialog>;
}

export function IntroVideo() {
  const { media } = usePresentation();
  const language = useLanguage();
  const url = language === 'en' ? media.introVideoEn || media.introVideo : media.introVideo;
  const [failedUrl, setFailedUrl] = useState(null);
  if (!url) return null;
  return <Box sx={{ my: 3 }}>
    <Typography variant="h6" gutterBottom>{t("Introduction")}</Typography>
    {failedUrl === url ? <Alert severity="info">{t("The introduction video could not be loaded. You can still start the game.")}</Alert> :
      <Box component="video" key={url} src={url} controls preload="metadata"
        aria-label={t("The Heat Is On introduction video")} onError={() => setFailedUrl(url)}
        sx={{ width: '100%', maxHeight: 420, bgcolor: '#111', borderRadius: 2 }} />}
  </Box>;
}

export function EventPresentation({ hazard, onClose, onViewImpact }) {
  const { media } = usePresentation();
  const [failedUrl, setFailedUrl] = useState(null);
  const url = media.eventGifs[hazard.id];
  return <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>{t(hazard.name)}{t(" event")}</DialogTitle>
    <DialogContent sx={{ textAlign: 'center' }}>
      {url && failedUrl !== url ? <Box component="img" src={url} alt={t("{0} event animation", [t(hazard.name)])}
        onError={() => setFailedUrl(url)} sx={{ width: '100%', maxHeight: 360, objectFit: 'contain' }} /> :
        <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}><HazardIcon hazardId={hazard.id} size={96} /></Box>}
      <Typography>{t("The event has been applied to all six towns, including Bludgeton.")}</Typography>
      {url === BUILT_IN_MEDIA.eventGifs[hazard.id] && <Typography variant="caption" component="p" sx={{ mt: 2, color: 'text.secondary' }}>
        <Link href="https://googlefonts.github.io/noto-emoji-files/" target="_blank" rel="noopener noreferrer">Animated Noto Emoji · Google</Link>
        {' · '}<Link href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</Link>
      </Typography>}
    </DialogContent>
    <DialogActions><Button onClick={onViewImpact} variant="contained">{t("View impact")}</Button></DialogActions>
  </Dialog>;
}
