// Admin / dev mode — sessionStorage gated. URL param sets it. Removing param keeps for session.
const ADMIN_KEY = "alchemystic_admin";
const DEV_KEY = "alchemystic_dev";

export function syncAdminFromURL() {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  if (p.has("admin")) sessionStorage.setItem(ADMIN_KEY, "1");
  if (p.has("dev")) sessionStorage.setItem(DEV_KEY, "1");
}

export function isAdmin() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_KEY) === "1";
}
export function isDev() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DEV_KEY) === "1";
}
export function clearAdmin() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_KEY);
  sessionStorage.removeItem(DEV_KEY);
}
