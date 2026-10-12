import { t, townLabel } from '../../i18n';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { Alert, AppBar, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, IconButton, Paper, Snackbar, Tab, Tabs, Toolbar, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import UndoIcon from '@mui/icons-material/Undo';
import CloseIcon from '@mui/icons-material/Close';
import TownPieCharts from './components/TownPieCharts';
import BarChartsView from './components/BarChartsView';
import GameTable from './components/GameTable';
import TownDetailsView from './components/TownDetailsView';
import HazardControls from './components/HazardControls';
import CardControls from './components/CardControls';
import { IntroVideo, MediaSettings, EventPresentation } from './components/PresentationMedia';
import RoundSettlement from './components/RoundSettlement';
import GameStages, { STAGES } from './components/GameStages';
import GameSummary from './components/GameSummary';
import HazardImpact from './components/HazardImpact';
import { getTotalRounds } from '../../utils/rounds';
import { hazards } from '../../constants/hazards';
import { allCards } from '../../constants/cards';
import service from '../../services/gameSessionService';

export default function Game() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { loading, error, currentSession, currentRound, towns, roundEvents, townCardPlays,
    loadSession, advanceRound, applyHazard, playCard, refreshSessionData, clearError,
    updateTown, revertToPreviousState, canRevert, setDigitalWheel, setStage } = useGame();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [notice, setNotice] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [presentedHazard, setPresentedHazard] = useState(null);
  const [impactReport, setImpactReport] = useState(null);
  const [impactOpen, setImpactOpen] = useState(false);
  const [wheelPromptOpen, setWheelPromptOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const summaryShown = useRef(null);
  const advancing = useRef(false);
  const loadRef = useRef(loadSession);
  loadRef.current = loadSession;
  const totalRounds = getTotalRounds(currentSession);
  const completed = currentSession?.isActive === false;
  const ready = currentSession?.id === sessionId;
  const stage = currentSession?.stage || (roundEvents[currentRound]?.length ? 'review' : 'adaptation');
  const controlsDisabled = loading || currentRound === 0 || completed;
  const wheelEnabled = currentSession?.digitalWheelEnabled !== false;
  const roundsPlayed = completed ? Math.max(0, currentRound - 1) : currentRound;
  useEffect(() => {
    setImpactReport(null); setImpactOpen(false); setPresentedHazard(null); setWheelPromptOpen(false);
    loadRef.current(sessionId);
  }, [sessionId]);

  const openSummary = useCallback(async () => {
    setSummaryOpen(true); setSummaryLoading(true); setSummaryError(''); setSummary(null);
    try { setSummary(await service.getSummary(sessionId)); }
    catch { setSummaryError('Could not load the game summary. Please retry.'); }
    finally { setSummaryLoading(false); }
  }, [sessionId]);
  useEffect(() => {
    if (ready && completed && !settlement && summaryShown.current !== sessionId) {
      summaryShown.current = sessionId; openSummary();
    }
  }, [ready, completed, settlement, sessionId, openSummary]);

  const confirmAdvanceRound = async () => {
    if (advancing.current) return;
    advancing.current = true;
    try {
      const result = await advanceRound(settlement?.endGame === true);
      if (!result) return;
      setDrawerOpen(false);
      if (result.lastSettlementRound) setSettlement({ committed: true, round: result.lastSettlementRound });
      setNotice({ message: result.isActive ? 'Round {0} begins.' : 'Game complete. Time to reflect together.', values: [result.currentRound], severity: 'success' });
    } finally { advancing.current = false; }
  };
  const settleRound = () => setSettlement({ committed: false, round: currentRound });
  const nextStage = async () => {
    if (currentRound === 0) return confirmAdvanceRound();
    if (completed) return openSummary();
    const index = STAGES.indexOf(stage);
    if (index < 2) return changeStage(STAGES[index + 1]);
    else settleRound();
  };
  const changeStage = async next => {
    if (next === 'review' && wheelEnabled && !roundEvents[currentRound]?.length) {
      setWheelPromptOpen(true); return;
    }
    if (await setStage(next)) setDrawerOpen(false);
  };
  const applyEvent = async hazardId => {
    const result = await applyHazard(hazardId);
    if (result) {
      const hazard = hazards.find(h => h.id === hazardId);
      setImpactReport({ hazard, round: currentRound, rows: result.impact });
      setPresentedHazard(hazard);
    }
    return result;
  };
  const applyCard = async (townId, cardId) => {
    const town = towns.find(t => t.id === townId);
    const card = allCards.find(c => c.id === cardId);
    if (!town || !card) return null;
    const result = await playCard(townId, cardId);
    if (result) setNotice({ message: '{0} applied to {1} (−{2} EP)', card, town, severity: 'success' });
    return result;
  };
  const updateTownDetails = async (townId, name, data = null) => {
    const town = towns.find(t => t.id === townId);
    const result = await updateTown(data || { ...town, name });
    if (result) { await refreshSessionData(); setNotice({ message: 'Town updated.', severity: 'success' }); }
  };
  const undo = async () => {
    if (await revertToPreviousState()) {
      setImpactReport(null); setImpactOpen(false);
      setNotice({ message: 'Last action undone.', severity: 'success' });
    }
  };
  if (!ready) return <Container sx={{ py: 5 }}>
    {error ? <Alert severity="error">{t(error)}</Alert> : <Typography>{t("Loading game data…")}</Typography>}
    <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>{t("Back to games")}</Button>
  </Container>;

  return <Box sx={{ flexGrow: 1 }}>
    <AppBar position="sticky" elevation={0} sx={{ top: 48 }}>
      <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: 1 }}>
        <Tooltip title={t("Back to games")}><IconButton color="inherit" aria-label={t("Back to games")} onClick={() => navigate('/')}><ArrowBackIcon /></IconButton></Tooltip>
        <IconButton color="inherit" aria-label={t("Show controls")} onClick={() => setDrawerOpen(true)}><MenuIcon /></IconButton>
        <Box sx={{ flexGrow: 1, minWidth: 150 }}><Typography variant="subtitle1" fontWeight="bold">{currentSession.name}</Typography><Typography variant="caption">{completed ? t("Completed · {0} rounds", [roundsPlayed]) : currentRound === 0 ? t("Ready to begin") : t("Round {0} of {1} · Year {2}", [currentRound, totalRounds, 2050 + currentRound])}</Typography></Box>
        {currentRound > 0 && !completed && <Button color="inherit" disabled={loading} onClick={() => setSettlement({ committed: false, round: currentRound, endGame: true })}>{t("End game")}</Button>}
        <Button color="inherit" startIcon={<UndoIcon />} disabled={loading || !canRevert || completed} onClick={undo}>{t("Undo")}</Button>
        <Button variant="contained" color="secondary" disabled={loading} onClick={nextStage}>{completed ? t("View summary") : currentRound === 0 ? t("Start game") : stage === 'adaptation' ? t("Next: event") : stage === 'hazard' ? t("Next: review") : t("Next: dividends")}</Button>
      </Toolbar>
    </AppBar>
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>{t(error)}</Alert>}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
        <Chip label={completed ? t("Game complete") : t("{0} planned rounds", [totalRounds])} variant="outlined" color="primary" sx={{ mr: 'auto' }} />
        <Button onClick={() => setMediaOpen(true)}>{t("Presentation media")}</Button>
        {impactReport && <Button variant="outlined" onClick={() => setImpactOpen(true)}>{t('View last event impact')}</Button>}
        {currentSession.lastSettlementRound > 0 && <Button variant="outlined" onClick={() => setSettlement({ committed: true, round: currentSession.lastSettlementRound })}>{t("Round ")}{currentSession.lastSettlementRound}{t(" dividends")}</Button>}
      </Box>
      {completed ? <Alert severity="success" sx={{ mb: 3 }}>{t("Game complete after {0} of {1} planned rounds. Review the summary and reflect on your decisions.", [roundsPlayed, totalRounds])}</Alert> : currentRound > 0 &&
        <GameStages stage={stage} onChange={changeStage} onSettle={settleRound} onOpenControls={() => setDrawerOpen(true)} loading={loading} finalRound={currentRound === totalRounds} />}
      <Paper sx={{ mb: 3 }}><Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="fullWidth" aria-label={t("Game views")}>
        <Tab label={t("Dashboard")} /><Tab label={t("Town details")} /><Tab label={t("Game history")} />
      </Tabs></Paper>
      {activeTab === 0 && (currentRound === 0 ? <Paper sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="overline" color="primary">{t("WELCOME TO THE HEAT IS ON")}</Typography>
        <Typography variant="h3" sx={{ my: 2 }}>{t("Explore a changing climate, together.")}</Typography>
        <Typography sx={{ maxWidth: 700 }}>{t("Guide five towns through {0} rounds of climate events and adaptation decisions. Compare their progress with Bludgeton, the town that does not play adaptation cards.", [totalRounds])}</Typography>
        <IntroVideo />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, my: 4 }}>
          {[t("Choose how to adapt"), t("Experience climate events"), t("Reflect on resilience")].map((text, i) => <Box key={text}><Chip label={`0${i + 1}`} sx={{ mb: 1 }} /><Typography fontWeight="bold">{t(text)}</Typography></Box>)}
        </Box>
        <Button variant="contained" size="large" disabled={loading} onClick={confirmAdvanceRound}>{t("Start game")}</Button>
      </Paper> : <><TownPieCharts towns={towns} /><BarChartsView towns={towns} /></>)}
      {activeTab === 1 && <TownDetailsView towns={towns} onUpdateTownName={updateTownDetails} readOnly={completed} />}
      {activeTab === 2 && <GameTable towns={towns} roundEvents={roundEvents} townCardPlays={townCardPlays} currentRound={currentRound} totalRounds={completed ? roundsPlayed : totalRounds} />}
    </Container>
    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { top: 48, height: 'calc(100% - 48px)', width: { xs: '100%', sm: 460 } } }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}><Typography variant="h6" sx={{ flex: 1 }}>{t("Presenter controls")}</Typography><IconButton aria-label={t("Close controls")} onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton></Box>
      <Divider />
      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{t(error)}</Alert>}
        {stage === 'adaptation' ? <><CardControls towns={towns} onPlayCard={applyCard} disabled={controlsDisabled} currentRound={currentRound} /><Divider sx={{ my: 3 }} /><Typography color="text.secondary">{t("When the group is ready, move forward to choose an event.")}</Typography><Button fullWidth sx={{ mt: 2 }} disabled={controlsDisabled} onClick={() => changeStage('hazard')}>{t("Next: event")}</Button></> :
        stage === 'hazard' ? <><HazardControls onApplyHazard={applyEvent} disabled={controlsDisabled} currentRound={currentRound} wheelEnabled={wheelEnabled} onToggleWheel={setDigitalWheel} /><Button fullWidth sx={{ mt: 3 }} disabled={controlsDisabled} onClick={() => changeStage('review')}>{t("Next: review")}</Button></> : <Typography>{t("Use the dashboard to review your towns. Choose a previous stage to revisit cards or events.")}</Typography>}
      </Box>
    </Drawer>
    {mediaOpen && <MediaSettings open onClose={() => setMediaOpen(false)} />}
    {presentedHazard && <EventPresentation hazard={presentedHazard} onClose={() => setPresentedHazard(null)} onViewImpact={() => { setPresentedHazard(null); setDrawerOpen(false); setImpactOpen(true); }} />}
    {impactOpen && impactReport && <HazardImpact report={impactReport} onClose={() => setImpactOpen(false)} />}
    <Dialog open={wheelPromptOpen} onClose={() => setWheelPromptOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Choose this round’s hazard first')}</DialogTitle>
      <DialogContent><Typography>{t('Spin the hazard wheel and apply this round’s event before reviewing.')}</Typography></DialogContent>
      <DialogActions><Button onClick={() => setWheelPromptOpen(false)}>{t('Cancel')}</Button>
        <Button variant="contained" onClick={() => { setWheelPromptOpen(false); setDrawerOpen(true); }}>{t('Go to hazard wheel')}</Button></DialogActions>
    </Dialog>
    {settlement && <RoundSettlement open onClose={() => setSettlement(null)} onConfirm={confirmAdvanceRound} round={settlement.round} committed={settlement.committed} towns={towns}
      dividends={currentSession.lastDividends} finalRound={currentRound === totalRounds} loading={loading} endGame={settlement.endGame} totalRounds={totalRounds} error={error} />}
    <GameSummary open={summaryOpen} onClose={() => setSummaryOpen(false)} report={summary} error={summaryError} loading={summaryLoading} onRetry={openSummary} />
    <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)}>{t(notice.message, notice.card ? [t(notice.card.name), townLabel(notice.town), notice.card.cost] : notice.values)}</Alert>}
    </Snackbar>
  </Box>;
}
