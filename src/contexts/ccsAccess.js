// Absolute milliseconds. Firebase keeps auth_time across ID token refreshes.
export function accessDeadline(uid, claims, ccsOnly = false) {
  if (!uid || uid === "ccs-reporter") return 0;
  const provider = claims.firebase?.sign_in_provider;
  if (provider === "password" && !ccsOnly) return Infinity;
  if (provider !== "custom" || !Number.isSafeInteger(claims.auth_time) ||
      !Number.isSafeInteger(claims.sub_expires)) return 0;
  return Math.min(claims.auth_time + 86400, claims.sub_expires) * 1000;
}

export function takeHandoff(location, history) {
  if (!/^\/auth\/?$/.test(location.pathname)) return null;
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  history.replaceState(history.state, "", location.pathname);
  return token || "";
}
