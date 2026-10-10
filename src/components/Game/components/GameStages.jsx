import { t } from '../../../i18n';
import { Box, Button, Paper, Step, StepLabel, Stepper, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const STAGES = ['adaptation', 'hazard', 'review'];
const labels = ['Adapt', 'Event', 'Review', 'Dividends'];
const help = {
  adaptation: 'Discuss your strategy and choose adaptation cards for each town.',
  hazard: 'Spin the digital or physical wheel, then apply the event to every town.',
  review: 'Compare the towns, flip the charts to explore NESH, and discuss the impacts.',
};
export default function GameStages({ stage, onChange, onSettle, onOpenControls, loading, finalRound }) {
  const index = Math.max(0, STAGES.indexOf(stage));
  return <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
    <Stepper activeStep={index} alternativeLabel sx={{ mb: 3 }}>
      {labels.map(label => <Step key={label}><StepLabel>{t(label)}</StepLabel></Step>)}
    </Stepper>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography variant="h6">{t(labels[index])}{t(" together")}</Typography>
        <Typography color="text.secondary">{t(help[STAGES[index]])}</Typography>
      </Box>
      {index > 0 && <Button disabled={loading} onClick={() => onChange(STAGES[index - 1])}>{t("Previous stage")}</Button>}
      {index < 2 && <Button variant="outlined" disabled={loading} onClick={onOpenControls}>
        {index === 0 ? t("Choose cards") : t("Choose event")}
      </Button>}
      <Button variant="contained" disabled={loading} endIcon={<ArrowForwardIcon />}
        onClick={index === 2 ? onSettle : () => onChange(STAGES[index + 1])}>
        {index === 0 ? t("Next: event") : index === 1 ? t("Next: review") : finalRound ? t("Settle & finish") : t("Next: dividends")}
      </Button>
    </Box>
  </Paper>;
}
