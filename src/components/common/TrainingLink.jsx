import { t } from '../../i18n';
import { Button } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { usePlatform } from '../../contexts/PlatformContext';
export default function TrainingLink({ variant = 'outlined' }) {
  const { trainingUrl } = usePlatform();
  return <Button variant={variant} startIcon={<SchoolIcon />} disabled={!trainingUrl}
    {...(trainingUrl ? { component: 'a', href: trainingUrl, target: '_blank', rel: 'noopener noreferrer' } : {})}>
    {trainingUrl ? t("Training module") : t("Training coming soon")}
  </Button>;
}
