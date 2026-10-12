import { createContext, useContext, useEffect, useState } from 'react';
const Context = createContext({ trainingUrl: '' });
export function PlatformProvider({ children }) {
  const [platform, setPlatform] = useState({ trainingUrl: '' });
  useEffect(() => {
    const controller = new AbortController();
    fetch('/platform.json', { signal: controller.signal }).then(response => response.json()).then(data => {
      const url = typeof data.trainingUrl === 'string' ? data.trainingUrl.trim() : '';
      setPlatform({ trainingUrl: /^https:\/\//i.test(url) ? url : '' });
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  return <Context.Provider value={platform}>{children}</Context.Provider>;
}
export const usePlatform = () => useContext(Context);
