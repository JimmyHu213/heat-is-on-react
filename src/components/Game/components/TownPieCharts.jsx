import { t } from '../../../i18n';
import { Box, Typography } from '@mui/material';
import TownResilienceCard from './TownResilienceCard';

export default function TownPieCharts({ towns }) {
  if (!towns?.length) return <Typography align="center">{t("No town data available")}</Typography>;
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 3, mb: 3, justifyItems: 'center' }}>
    {towns.map(town => <TownResilienceCard key={town.id} town={town} />)}
  </Box>;
}
