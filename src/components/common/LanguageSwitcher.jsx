import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useLanguage, setLanguage } from '../../i18n';

export default function LanguageSwitcher() {
  const language = useLanguage();
  return <><Box sx={{ height: 48, flexShrink: 0 }} /><Box component="nav" aria-label="Language / 语言" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1201, height: 48,
    bgcolor: 'background.paper', borderBottom: '1px solid #dce7e1', display: 'flex',
    alignItems: 'center', justifyContent: 'flex-end', gap: 1, px: { xs: 2, md: 3 } }}>
    <TranslateIcon fontSize="small" color="primary" />
    <Typography variant="caption">Language / 语言</Typography>
    <ToggleButtonGroup size="small" exclusive value={language} aria-label="Language / 语言"
      onChange={(_, value) => { if (value) setLanguage(value); }} sx={{ height: 32 }}>
      <ToggleButton value="en" aria-label="English">English</ToggleButton>
      <ToggleButton value="zh" aria-label="中文">中文</ToggleButton>
    </ToggleButtonGroup>
  </Box></>;
}
