# Changelog

## 1.1.0 (2026-11-25)

Fixes from a real run on a vibecoded landing page (Kopa, a finance app for freelancers).

- **Icon sheets keep the count and style.** Step 5 now says when to use `asset_type: "icon_set"` (flat or line icons) and when to use a free prompt (3D, clay, painted or illustrated objects), gives a prompt pattern that holds "exactly 6" and the style, and asks the agent to check both before showing the result.
- **Splitting after an edit.** `limora_split_icon_set` refuses any sheet that was iterated ("Only for icon sets"). Step 5 now says so and points to the local fallback.
- **New `scripts/split-sheet.mjs`.** Cuts any sheet locally and for free: it finds objects by transparency or by background color, pads each to a square and writes `<name>.png` files in reading order. It uses the Playwright the video step already needs, so there are no new dependencies.
- **New `scripts/sample-color.mjs`.** Prints the banner's real edge color, so the page background matches it exactly. Step 6 now says to use the measured hex, never the hex from the prompt.
- **No more mix-ups with the other `unslop` skill.** The description and the README name limora-unslop clearly and explain how it differs.
- **Reel template pitfalls:**
  - It warns about selector specificity (`.app .btn`, not `.btn`), so button text can't vanish after the color step.
  - Reworded button and link labels stay centered (`reel.css`).
  - It documents the patterns for centered-to-left text, centered button rows and emoji-to-icon centering with `inset` and `margin: auto`.
- **render.mjs:**
  - `--stills` writes to a temp folder (or `--out-dir`) instead of the project.
  - Stills default to `--scale 1`.
  - `--stills auto` picks the key moments itself.
  - `--sheet` tiles the stills into one labeled image.
  - `PLAYWRIGHT_DIR` is now also documented in step 9.
- **Length target.** The reel should run 15 to 25 seconds. `REEL.pace` scales every default hold, `compare: false` skips the before/after drag, and the renderer warns when the reel runs over 25 seconds.
- **Transparency flag while a job runs.** Step 5 now says to trust only the finished job (`limora_get_job`), since a running job can report `transparent_background: false`.
- The scan labels in step 9 are now described as purple Limora labels (they were yellow in an early version).

## 1.0.0 (2026-11-25)

First release.
