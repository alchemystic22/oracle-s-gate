// Internal observation log. FIFO 500 cap. Not user-visible except via /admin obs view.
const OBS_KEY = "alchemystic_obs_v1";
const CAP = 500;

export type ObsEvent = {
  t: number;
  kind: string;
  meta?: Record<string, unknown>;
};

export function obs(kind: string, meta?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(OBS_KEY);
    const arr: ObsEvent[] = raw ? JSON.parse(raw) : [];
    arr.push({ t: Date.now(), kind, meta });
    while (arr.length > CAP) arr.shift();
    localStorage.setItem(OBS_KEY, JSON.stringify(arr));
  } catch { /* silent */ }
}

export function readObs(): ObsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(OBS_KEY) || "[]");
  } catch { return []; }
}

export function clearObs() {
  if (typeof window !== "undefined") localStorage.removeItem(OBS_KEY);
}
