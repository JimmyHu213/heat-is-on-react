import { getPlayerCount } from "../../game/options.js";

export function summarizeHosting(active, finished) {
  const counts = finished.map(getPlayerCount).filter((count) => Number.isInteger(count) && count > 0);
  return {
    total: active.length + finished.length,
    active: active.length,
    finished: finished.length,
    attendances: counts.length ? counts.reduce((total, count) => total + count, 0) : null,
    missing: finished.length - counts.length,
  };
}
