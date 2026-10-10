import { useSyncExternalStore } from 'react';
import zh from './zh.js';

export const LANGUAGE_KEY = 'heat-is-on-language';
const supported = value => value === 'zh' || value === 'en';
function initialLanguage() {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (supported(saved)) return saved;
  } catch { /* Language selection also works without browser storage. */ }
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('zh') ? 'zh' : 'en';
}
let language = initialLanguage();
const listeners = new Set();
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => language;

export function setLanguage(value) {
  if (!supported(value)) return;
  language = value;
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(LANGUAGE_KEY, value); } catch { /* In-memory fallback. */ }
  }
  if (typeof document !== 'undefined') document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en';
  listeners.forEach(listener => listener());
}
if (typeof window !== 'undefined') {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  window.addEventListener('storage', event => {
    if (event.key === LANGUAGE_KEY && supported(event.newValue)) setLanguage(event.newValue);
  });
}

export function translate(message, locale, values = []) {
  if (typeof message !== 'string') return message;
  const key = message.trim();
  if (!key) return message;
  const translated = locale === 'zh' ? zh[key] ?? key : key;
  // Preserve spaces surrounding text fragments and never interpret user text as HTML.
  const result = message.slice(0, message.length - message.trimStart().length) + translated +
    message.slice(message.trimEnd().length);
  return result.replace(/\{(\d+)\}/g, (match, index) => values[index] === undefined ? match : String(values[index]));
}
export const t = (message, values) => translate(message, language, values);
export const getLanguage = snapshot;
export const useLanguage = () => useSyncExternalStore(subscribe, snapshot, () => 'en');
export const localeTag = () => language === 'zh' ? 'zh-CN' : 'en-GB';
export const townLabel = town => town.name === `Town ${town.townNumber}` ? t(town.name) : town.name;
