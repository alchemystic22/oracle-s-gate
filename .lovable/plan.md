# Admin Access Shortcuts for Page Review

Goal: as an admin you should be able to land directly on any page (especially Gate 1's "Book of Spiral Fractures") without completing the invocation, without waiting on time-locks, and without clicking through Threshold → Encounter → Obstruction.

## Activate dev mode

Append `?dev=1` to any URL once per browser session. Flag persists in `sessionStorage`.

Preview base: `https://id-preview--ffd98a64-8826-492a-8639-19a60594037f.lovable.app`

## Top-level routes

- `/?dev=1`             — landing / Matrix title sequence / invocation
- `/gates?dev=1`        — constellation of 7 gates
- `/cabinet?dev=1`      — Reading Cabinet (three-offering resonance ritual)
- `/sovereign?dev=1`    — Sovereign Action Layer (ledger)

## Cabinet — dev controls

- `/cabinet?dev=1&mode=avatar_chose`    — force the Avatar-chose branch (all three cards stay face-down; click to flip)
- `/cabinet?dev=1&mode=oracle_revealed` — force the Oracle-revealed branch (one card auto-illuminates after 6s stillness)

## Sovereign — dev controls

- `/sovereign?dev=1&seed=demo` — seed three sealed witness cards (body / relations / voice across micro/meso/macro), three open cards (craft scheduled, mind chosen, spirit chosen), 2 Grace Mark messages. Only seeds when the ledger is empty.

## Gate stubs (sealed copy)

- `/gate/2?dev=1` … `/gate/7?dev=1`

## Gate 1 (Book of Spiral Fractures) — phase deep-links

- `/gate/1?dev=1&phase=threshold`            — door / approach
- `/gate/1?dev=1&phase=encounter`            — "Something promised you the world…"
- `/gate/1?dev=1&phase=obstruction`          — two-response choice
- `/gate/1?dev=1&phase=book_emergence`       — Book materializing
- `/gate/1?dev=1&phase=page_open`            — Book of Spiral Fractures, open page
- `/gate/1?dev=1&phase=corrective_gate_open` — corrective unlock
- `/gate/1?dev=1&phase=relocked`             — relock screen
- `/gate/1?dev=1&phase=completion`           — gate-complete screen

## Reset, if state gets stuck

In DevTools console on any preview page:

```js
localStorage.removeItem("alchemystic_state_v2"); location.reload();
```

(State key remains `_v2` for backwards compatibility; v3 schema is written in place via the migration on first load.)
