import { useEffect, useState } from "react";

/** Returns true once `ms` have elapsed since `anchor`. Polls at 250ms. */
export function useTimeLock(anchor: number | undefined, ms: number) {
  const [ready, setReady] = useState<boolean>(() => {
    if (!anchor) return false;
    return Date.now() - anchor >= ms;
  });
  useEffect(() => {
    if (!anchor) { setReady(false); return; }
    const check = () => {
      const ok = Date.now() - anchor >= ms;
      setReady(ok);
      return ok;
    };
    if (check()) return;
    const id = window.setInterval(() => { if (check()) window.clearInterval(id); }, 250);
    return () => window.clearInterval(id);
  }, [anchor, ms]);
  return ready;
}
