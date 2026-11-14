// src/services/gameLifecycle.js
// Single-function lifecycle hook points for CCS integration (game_runs log).

let createdHook = null;
let completedHook = null;

export function registerGameLifecycleHooks({ onCreated = null, onCompleted = null } = {}) {
  createdHook = typeof onCreated === "function" ? onCreated : null;
  completedHook = typeof onCompleted === "function" ? onCompleted : null;
}

export async function onGameCreated(session) {
  if (createdHook) {
    await createdHook(session);
  }
}

export async function onGameCompleted(session) {
  if (completedHook) {
    await completedHook(session);
  }
}
