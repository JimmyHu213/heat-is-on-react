import { t, townLabel } from '../../../i18n';
import { useState } from 'react';
import { Box, Button, Card, Chip, LinearProgress, Typography } from '@mui/material';
import FlipIcon from '@mui/icons-material/Flip';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import TownPieChart from '../../Charts/TownPieChart';
import { neshAverages } from '../../../utils/gameSummary';

const labels = { nature: 'Nature', economy: 'Economy', society: 'Society', health: 'Health' };
export default function TownResilienceCard({ town }) {
  const [flipped, setFlipped] = useState(false);
  const averages = neshAverages(town);
  const data = Object.entries(averages).map(([aspect, value]) => ({ aspect: t(labels[aspect]), value }));
  return <Card sx={{ width: '100%', maxWidth: 360, p: 2, borderTop: '4px solid', borderColor: town.isComparisonTown ? 'secondary.main' : 'primary.main' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
      <Typography variant="h6">{townLabel(town)}</Typography>
      <Chip size="small" label={`${town.effortPoints} EP`} />
    </Box>
    {town.isComparisonTown && <Typography variant="caption" color="text.secondary">{t("Comparison town · no adaptation cards")}</Typography>}
    <Box sx={{ perspective: 1000, height: 410 }}>
      <Box sx={{ height: '100%', position: 'relative', transformStyle: 'preserve-3d',
        transition: 'transform .55s ease', transform: flipped ? 'rotateY(180deg)' : 'none',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }}>
        <Box aria-hidden={flipped} sx={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', display: 'flex', justifyContent: 'center' }}>
          <TownPieChart town={town} embedded />
        </Box>
        <Box aria-hidden={!flipped} sx={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', bgcolor: 'background.paper' }}>
          <Typography variant="subtitle1" align="center" sx={{ mt: 1 }}>{t("NESH resilience")}</Typography>
          <Box sx={{ width: '100%', height: 215 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="65%">
                <PolarGrid /><PolarAngleAxis dataKey="aspect" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={t("Resilience (%)")} dataKey="value" stroke="#23766b" fill="#23766b" fillOpacity={0.25} isAnimationActive={false} />
                <Tooltip formatter={value => [`${value}%`, t('Resilience')]} />
              </RadarChart>
            </ResponsiveContainer>
          </Box>
          {data.map(row => <Box key={row.aspect} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption">{t(row.aspect)}</Typography><Typography variant="caption" fontWeight="bold">{row.value}%</Typography></Box>
            <LinearProgress variant="determinate" value={row.value} sx={{ height: 5, borderRadius: 4 }} />
          </Box>)}
          <Typography variant="caption" color="text.secondary">{t("Average across the five hazards, from 0 to 100%.")}</Typography>
        </Box>
      </Box>
    </Box>
    <Button fullWidth startIcon={<FlipIcon />} aria-pressed={flipped} aria-label={t("{0} for {1}", [t(flipped ? "Show hazard chart" : "Show NESH"), townLabel(town)])}
      onClick={() => setFlipped(value => !value)}>{flipped ? t("Show hazard chart") : t("Flip to NESH")}</Button>
  </Card>;
}
