# Plan: Bundle Gate 1 verification screenshots as a downloadable zip

## Goal
Re-capture the full Gate 1 end-to-end verification sequence (desktop + mobile) and deliver as a single zipped artifact under 30 MB at `/mnt/documents/`.

## Steps

1. **Desktop captures (1440x900)** via `browser--view_preview` + `browser--screenshot` for each state, navigating with `?dev=true` to bypass time-locks:
   - `/` — Opening invocation
   - `/gates` — Constellation
   - `/gate/1` — Threshold
   - `/gate/1` — Encounter (after "Approach the Gate")
   - `/gate/1` — Layer 3 obstruction (both stance cards visible)
   - `/gate/1` — Book emergence
   - `/gate/1` — False Arrival corrective (full page)
   - `/gate/1` — Splintered Trust corrective (full page)
   - `/gate/1` — Unlock sequence (epigraph + seal)
   - `/gate/1` — Completion screen

2. **Mobile captures (390x844)** — same 10 states via `browser--set_viewport_size`.

3. **Save** each PNG to `/tmp/screenshots/{desktop|mobile}/NN-state.png`.

4. **Zip** with `cd /tmp/screenshots && zip -r /mnt/documents/gate-1-verification.zip .` and verify final size < 30 MB.

5. **Deliver** via `<presentation-artifact path="gate-1-verification.zip" mime_type="application/zip">`, plus the written confirmation block (auto-fail conditions false, aesthetic match, etc.) inline in the chat reply.

## Notes
- No code changes. Pure capture + bundling.
- If any state requires interaction (button clicks) the desktop pass uses `browser--act`; admin overlay phase-jumps where available shortcut the flow.
- If zip exceeds 30 MB, re-encode PNGs at reduced dimensions and re-zip.
