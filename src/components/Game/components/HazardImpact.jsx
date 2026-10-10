import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { t, townLabel } from '../../../i18n';
import { ASPECTS } from '../../../utils/rounds';

export default function HazardImpact({ report, onClose }) {
  return <Dialog open fullWidth maxWidth="lg" onClose={onClose}>
    <DialogTitle>{t('{0} impact · Round {1}', [t(report.hazard.name), report.round])}</DialogTitle>
    <DialogContent>
      <Alert severity="info" sx={{ mb: 2 }}>{t('Actual points lost in this event, including cascading penalties. Resilience is the average of all 20 segments.')}</Alert>
      <Box sx={{ overflowX: 'auto' }}><Table size="small">
        <TableHead><TableRow><TableCell>{t('Town')}</TableCell>
          {ASPECTS.map(aspect => <TableCell key={aspect} align="right">{t(aspect)}</TableCell>)}
          <TableCell align="right">{t('Total points lost')}</TableCell>
          <TableCell align="right">{t('Resilience before → after')}</TableCell>
        </TableRow></TableHead>
        <TableBody>{report.rows.map(row => <TableRow key={row.id}>
          <TableCell>{townLabel(row)}{row.isComparisonTown && <Typography variant="caption" display="block">{t('Comparison town')}</Typography>}</TableCell>
          {ASPECTS.map(aspect => <TableCell key={aspect} align="right">−{row.aspectLoss[aspect]}</TableCell>)}
          <TableCell align="right"><strong>−{row.loss}</strong></TableCell>
          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{row.before.toFixed(1)}% → {row.after.toFixed(1)}%</TableCell>
        </TableRow>)}</TableBody>
      </Table></Box>
    </DialogContent>
    <DialogActions><Button variant="contained" onClick={onClose}>{t('Close')}</Button></DialogActions>
  </Dialog>;
}
