import { createContext, useContext, useEffect, useState } from 'react';
import { HAZARD_IDS } from '../utils/rounds';
import { BUILT_IN_MEDIA } from '../constants/presentation';

const PresentationContext = createContext();
const EMPTY = { introVideo: '', eventGifs: {}, hazardIcons: {} };
const KEY = 'heat-is-on-presentation';

export function mediaUrl(value) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) ? url : '';
}

function normalize(data) {
  return {
    introVideo: mediaUrl(data?.introVideo) || BUILT_IN_MEDIA.introVideo,
    introVideoEn: mediaUrl(data?.introVideoEn) || BUILT_IN_MEDIA.introVideoEn,
    eventGifs: Object.fromEntries(HAZARD_IDS.map(id => [id, mediaUrl(data?.eventGifs?.[id]) || BUILT_IN_MEDIA.eventGifs[id]])),
    hazardIcons: Object.fromEntries(HAZARD_IDS.map(id => [id, mediaUrl(data?.hazardIcons?.[id]) || BUILT_IN_MEDIA.hazardIcons[id]])),
  };
}

export function PresentationProvider({ children }) {
  const [defaults, setDefaults] = useState(() => normalize(EMPTY));
  const [override, setOverride] = useState(() => {
    try { const data = JSON.parse(localStorage.getItem(KEY)); return data ? normalize(data) : null; } catch { return null; }
  });
  useEffect(() => {
    const controller = new AbortController();
    fetch('/presentation.json', { signal: controller.signal })
      .then(response => response.ok ? response.json() : EMPTY)
      .then(data => setDefaults(normalize(data)))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const saveMedia = data => {
    const clean = normalize(data);
    localStorage.setItem(KEY, JSON.stringify(clean));
    setOverride(clean);
  };
  const resetMedia = () => { localStorage.removeItem(KEY); setOverride(null); };
  return <PresentationContext.Provider value={{ media: override || defaults, saveMedia, resetMedia }}>
    {children}
  </PresentationContext.Provider>;
}

export const usePresentation = () => useContext(PresentationContext);
