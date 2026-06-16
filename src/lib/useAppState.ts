import { useCallback, useEffect, useState } from "react";
import { AppState, defaultState, loadState, saveState } from "./state";

export function useAppState() {
  const [state, setState] = useState<AppState>(() => defaultState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  return { state, update, hydrated };
}
