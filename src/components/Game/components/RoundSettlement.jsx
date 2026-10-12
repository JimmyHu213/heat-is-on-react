import { t, townLabel } from '../../../i18n';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { calculateDividend } from '../../../utils/rounds';

export default function RoundSettlement({ open, onClose, onConfirm, round, towns, dividends, committed, finalRound, loading, endGame, totalRounds, error }) {
  const rows = towns.map(town => ({ ...town, ...calculateDividend(town),
    amount: committed ? dividends?.[town.id] ?? 0 : calculateDividend(town).amount }));
  return <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>{endGame && !committed ? t("End game · ") : ''}{t("Round {0} dividends", [round])}{committed ? t(" — awarded") : ''}</DialogTitle>
    <DialogContent>
      {!committed && error && <Alert severity="error" sx={{ mb: 2 }} role="alert">{t(error)}</Alert>}
      <Typography sx={{ mb: 2 }}>{t("Presenter: give each town the EP shown below. Every segment at 100% earns 5 EP.")}</Typography>
      {endGame && !committed && <Alert severity="warning" sx={{ mb: 2 }}>{t("The game will end after this round. The remaining ")}{totalRounds - round}{t(" planned rounds will not be played.")}</Alert>}
      <Alert severity={committed ? 'success' : 'info'} sx={{ mb: 2 }}>
        {committed ? t("These dividends are already included in the digital budgets. Do not add them again.") :
          t("Confirming will add dividends to the digital budgets and close this round.")}
      </Alert>
      <Table size="small">
        <TableHead><TableRow><TableCell>{t("Town")}</TableCell><TableCell align="right">{t("100% segments")}</TableCell><TableCell align="right">{t("Give EP")}</TableCell></TableRow></TableHead>
        <TableBody>{rows.map(row => <TableRow key={row.id}>
          <TableCell>{townLabel(row)}{row.isComparisonTown ? t(' (comparison)') : ''}</TableCell>
          <TableCell align="right">{committed ? row.amount / 5 : row.segments}</TableCell>
          <TableCell align="right"><strong>+{row.amount} EP</strong></TableCell>
        </TableRow>)}</TableBody>
      </Table>
      <Typography sx={{ mt: 2 }} fontWeight="bold">{t("Total: ")}{rows.reduce((total, row) => total + row.amount, 0)} EP</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>{committed ? t("Close") : t("Continue this round")}</Button>
      {!committed && <Button variant="contained" onClick={onConfirm} disabled={loading}>
        {loading ? t("Settling…") : finalRound || endGame ? t("Award dividends & finish game") : t("Award dividends & start next round")}
      </Button>}
    </DialogActions>
  </Dialog>;
}
