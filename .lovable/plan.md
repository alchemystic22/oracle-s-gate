# Admin Access Shortcuts for Page Review

Goal: as an admin you should be able to land directly on any page (especially Gate 1's "Book of Spiral Fractures") without completing the invocation, without waiting on time-locks, and without clicking through Threshold → Encounter → Obstruction.

## A. Dev mode bypasses the invocation redirect

**File:** `src/routes/gate.$gateId.tsx`

Currently line 54–56 redirects to `/` if `state.invocationCompletedAt` is unset. We'll exempt dev mode:

```ts
useEffect(() => {
  if (hydrated && !state.invocationCompletedAt && !isDev()) nav({ to: "/" });
}, [hydrated, state.invocationCompletedAt, nav]);
```

`isDev()` is already imported (line 18). No other change in this block.

Effect: `/gate/1?dev=1` no longer bounces back to `/`. Combined with the existing dev bypasses (line 64 gate accessibility, every `useTimeLock` call), all 7 gate URLs become directly reachable.

## B. `?phase=` deep-link into any Gate 1 phase

**File:** `src/routes/gate.$gateId.tsx`, inside `GateOne` (around line 111–129).

Add, after the existing visited-mark `useEffect`:

```ts
// Admin: ?phase=<name> jumps Gate 1 directly to that phase (dev only)
useEffect(() => {
  if (!isDev()) return;
  const p = new URLSearchParams(window.location.search).get("phase");
  const valid: Gate1State["phase"][] = [
    "threshold", "encounter", "obstruction",
    "book_emergence", "page_open",
    "corrective_gate_open", "relocked", "completion",
  ];
  if (p && valid.includes(p as Gate1State["phase"]) && p !== g1.phase) {
    setPhase(p as Gate1State["phase"]);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Gated behind `isDev()` so it can never be triggered by a non-admin URL.

Effect: `/gate/1?dev=1&phase=page_open` lands you straight inside the open Book on the corrective page; `?phase=book_emergence` shows the Book emerging animation; etc. Phase persists in localStorage so a refresh keeps you there.

## Files touched

- `src/routes/gate.$gateId.tsx` — two small edits (one-line redirect guard, one `useEffect` block).

No new files. No styling changes. No effect on a non-dev visitor — every shortcut is `isDev()`-gated.

## Admin URL cheat sheet (after this lands)

Activate dev once per browser session by appending `?dev=1` to any URL. The flag persists in `sessionStorage` (set in `src/lib/admin.ts`), so subsequent pages don't need it — but it's harmless to keep.

Preview base: `https://id-preview--ffd98a64-8826-492a-8639-19a60594037f.lovable.app`

Top-level routes:
- `/?dev=1`             — landing / Matrix title sequence / invocation
- `/gates?dev=1`        — constellation of 7 gates
- `/cabinet?dev=1`      — cabinet of passages
- `/sovereign?dev=1`    — sovereign action layer

Gate stubs (sealed copy):
- `/gate/2?dev=1` … `/gate/7?dev=1`

Gate 1 (Book of Spiral Fractures) — phase deep-links:
- `/gate/1?dev=1&phase=threshold`            — door / approach
- `/gate/1?dev=1&phase=encounter`            — "Something promised you the world…"
- `/gate/1?dev=1&phase=obstruction`          — two-response choice
- `/gate/1?dev=1&phase=book_emergence`       — Book materializing
- `/gate/1?dev=1&phase=page_open`            — **Book of Spiral Fractures, open page** ← review target
- `/gate/1?dev=1&phase=corrective_gate_open` — corrective unlock
- `/gate/1?dev=1&phase=relocked`             — relock screen
- `/gate/1?dev=1&phase=completion`           — gate-complete screen

## Reset, if state gets stuck

In DevTools console on any preview page:

```js
localStorage.removeItem("alchemystic_state_v2"); location.reload();
```
