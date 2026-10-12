import { t } from '../../../i18n';
import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { hazards } from '../../../constants/hazards';
import { bushfireColor1, floodColor1, stormSurgeColor1, heatwaveColor1, biohazardColor1 } from '../../../constants/palette';

const colors = [bushfireColor1, floodColor1, stormSurgeColor1, heatwaveColor1, biohazardColor1];
export default function HazardWheel({ disabled, onSelect, onSpinningChange }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const spin = () => {
    if (disabled || spinning) return;
    const value = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    const index = Math.floor(value * hazards.length);
    const target = 360 - (index * 72 + 36);
    const next = rotation + 1800 + (target - rotation % 360 + 360) % 360;
    setResult(null); setSpinning(true); onSpinningChange(true); setRotation(next);
    timer.current = setTimeout(() => {
      setSpinning(false); onSpinningChange(false); setResult(hazards[index]);
      onSelect(hazards[index]);
    }, 4100);
  };
  return <Box sx={{ my: 2, textAlign: 'center' }}>
    <Box sx={{ width: 260, height: 275, mx: 'auto', position: 'relative' }}>
      <Box aria-hidden sx={{ position: 'absolute', top: 0, left: 118, zIndex: 1,
        width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '24px solid #172e37' }} />
      <Box aria-label={t("Five equal hazard sectors")} sx={{ position: 'absolute', top: 12,
        width: 260, height: 260, borderRadius: '50%', border: '6px solid white', boxShadow: 3,
        background: `conic-gradient(${colors.map((color, i) => `${color} ${i * 72}deg ${(i + 1) * 72}deg`).join(',')})`,
        transform: `rotate(${rotation}deg)`, transition: 'transform 4s cubic-bezier(.12,.7,.12,1)',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }}>
        {hazards.map((hazard, index) => <Box key={hazard.id} sx={{ position: 'absolute', inset: 0,
          transform: `rotate(${index * 72 + 36}deg)` }}>
          <Typography sx={{ position: 'absolute', top: 35, left: '50%', width: 95, ml: '-47.5px',
            fontSize: 12, fontWeight: 'bold', color: '#fff', textShadow: '0 1px 3px #333', transform: 'rotate(90deg)' }}>{t(hazard.name)}</Typography>
        </Box>)}
      </Box>
    </Box>
    <Typography aria-live="polite" sx={{ my: 1 }}>{spinning ? t("Spinning…") : result ? t("Selected: {0}", [t(result.name)]) : t("Spin to choose this round’s event")}</Typography>
    <Button variant="contained" disabled={disabled || spinning} onClick={spin}>{t("Spin hazard wheel")}</Button>
  </Box>;
}
