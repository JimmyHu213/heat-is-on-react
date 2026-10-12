import { useState } from 'react';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FloodIcon from '@mui/icons-material/Flood';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BugReportIcon from '@mui/icons-material/BugReport';
import { usePresentation } from '../../contexts/PresentationContext';

const icons = { bushfire: LocalFireDepartmentIcon, flood: FloodIcon,
  stormSurge: ThunderstormIcon, heatwave: WbSunnyIcon, biohazard: BugReportIcon };

export default function HazardIcon({ hazardId, color, size = 24 }) {
  const { media } = usePresentation();
  const url = media.hazardIcons[hazardId];
  const [failedUrl, setFailedUrl] = useState(null);
  const Icon = icons[hazardId];
  if (url && failedUrl !== url) return <img src={url} alt="" width={size} height={size}
    style={{ objectFit: 'contain', display: 'block' }} onError={() => setFailedUrl(url)} />;
  return Icon ? <Icon sx={{ color, fontSize: size }} /> : null;
}
