import { t, townLabel } from '../../../i18n';
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { hazards } from '../../../constants/hazards';

const names = towns => towns.map(town => townLabel(town)).join(', ');
export default function GameSummary({ open, onClose, report, error, onRetry, loading }) {
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" aria-labelledby="summary-title">
    <DialogTitle id="summary-title" sx={{ bgcolor: 'primary.main', color: '#fff', p: 3 }}>
      <Typography component="span" variant="overline">{t("THE HEAT IS ON · GAME REFLECTION")}</Typography>
      <Typography component="div" variant="h4" sx={{ mt: 1 }}>{t("A story of resilience")}</Typography>
      {report && <Typography component="div" variant="body2" sx={{ mt: 1 }}>{report.name} · {t("{0} of {1} rounds played", [report.roundsPlayed, report.totalRounds])}{report.endedEarly ? t(" · ended early") : ''}</Typography>}
    </DialogTitle>
    <DialogContent sx={{ p: { xs: 2, md: 3 }, pt: '24px !important' }}>
      {loading && <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress /><Typography>{t("Preparing your summary…")}</Typography></Box>}
      {error && <Alert severity="error" action={<Button onClick={onRetry}>{t("Retry")}</Button>}>{t(error)}</Alert>}
      {report && <>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}><Typography color="text.secondary">{t("Events experienced")}</Typography><Typography variant="h3">{report.eventCount}</Typography><Typography>{t(report.roundsPlayed === 1 ? "{0} round of decisions" : "{0} rounds of decisions", [report.roundsPlayed])}</Typography></Paper>
          <Paper variant="outlined" sx={{ p: 2 }}><Typography color="text.secondary">{t("Resilience highlights")}</Typography><Typography variant="h6">{names(report.mostResilient)}</Typography><Typography>{report.mostResilient[0]?.resilience.toFixed(1)}{t("% final average resilience")}</Typography></Paper>
          <Paper variant="outlined" sx={{ p: 2 }}><Typography color="text.secondary">{t("Biggest event challenge")}</Typography><Typography variant="h6">{!report.hasCompleteImpacts ? t("Historical impact data unavailable") : report.mostImpacted.length ? names(report.mostImpacted) : t("No recorded event loss")}</Typography><Typography variant="body2">{report.mostImpacted.length ? t("{0} resilience points lost to events", [report.mostImpacted[0].eventLoss]) : t("Includes Bludgeton in all comparisons")}</Typography></Paper>
        </Box>
        {!report.hasCompleteImpacts && <Alert severity="info" sx={{ mb: 2 }}>{t("Some older events were saved without impact measurements. Their event losses are not ranked. Final resilience scores remain available.")}</Alert>}
        <Typography variant="h6" gutterBottom>{t("Events along the way")}</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          {Array.from({ length: report.roundsPlayed }, (_, i) => i + 1).map(round => {
            const events = report.events.find(e => e.roundNumber === round)?.hazardIds || [];
            return <Chip key={round} variant="outlined" label={t("Round {0}: {1}", [round, events.length ? events.map(id => t(hazards.find(h => h.id === id)?.name || id)).join(', ') : t("No events")])} />;
          })}
        </Box>
        <Typography variant="h6" gutterBottom>{t("Every town, including Bludgeton")}</Typography>
        <TableContainer><Table size="small">
          <TableHead><TableRow>{[t("Town"), t("Final resilience"), t("Event loss¹"), t("Segments ≤20%"), t("Dividends"), t("Budget")].map(label => <TableCell key={label}>{t(label)}</TableCell>)}</TableRow></TableHead>
          <TableBody>{report.towns.map(town => <TableRow key={town.id} sx={{ bgcolor: town.isComparisonTown ? 'action.hover' : undefined }}>
            <TableCell><strong>{townLabel(town)}</strong>{town.isComparisonTown && <Typography variant="caption" display="block">{t("Comparison town")}</Typography>}</TableCell>
            <TableCell>{town.resilience.toFixed(1)}%</TableCell><TableCell>{report.hasCompleteImpacts ? town.eventLoss : t("Not recorded")}</TableCell>
            <TableCell>{town.vulnerableSegments}</TableCell><TableCell>{report.hasDividends ? `+${town.dividends} EP` : t("Not recorded")}</TableCell><TableCell>{town.effortPoints} EP</TableCell>
          </TableRow>)}</TableBody>
        </Table></TableContainer>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>{t("¹ Sum of resilience points removed by events, including cascading penalties. Final resilience is the average of all 20 segments.")}</Typography>
        <Paper sx={{ mt: 3, p: 2, bgcolor: '#f1f6f3' }}><Typography fontWeight="bold" gutterBottom>{t("Discuss together")}</Typography><Typography>{t("Which decisions helped most? How did your towns compare with Bludgeton? What would you do differently next time?")}</Typography></Paper>
      </>}
    </DialogContent>
    <DialogActions sx={{ p: 2 }}><Button variant="contained" onClick={onClose}>{t("Close summary")}</Button></DialogActions>
  </Dialog>;
}
