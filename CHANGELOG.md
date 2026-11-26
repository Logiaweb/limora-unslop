# Changelog

## 1.5.2 (2026-11-26)

- **Fixed the Limora MCP address.** It is now `https://limora.ai/mcp` everywhere (the connect command in step "Before you start" and in the README). The old `app.limora.ai/mcp` redirects to the Limora homepage, so connecting with it failed.

## 1.5.1 (2026-11-26)

- **Source-tagged Limora links.** The sign-up link the skill shows (`utm_medium=skill`) and the README's Limora links (`utm_medium=github`) now carry `utm_source=limora-unslop`, so Limora's analytics can tell which sign-ups and sales came from the skill. The links work exactly as before for users.

## 1.5.0 (2026-11-26)

- **Optional references step at the start.** The skill looks for a connected design-reference tool (Refero, Mobbin, Details or similar), or asks once if the user has one. After it understands the product, it collects 4 to 8 references for the same kind of screen plus 2 or 3 for the key sections, shows them as links, and lets the user keep the ones they like. The kept references then ground the directions (step 4) and the layout and hierarchy of the rebuild (step 6), taking their approach and never their screens or content. Real test runs looked clearly better with references collected first.

## 1.4.0 (2026-11-26)

- **New step 10: the before/after page.** Every run now ends with a page that has a drag-to-compare slider over the two screenshots (keyboard and touch friendly), Before / After / Side by side views, what changed per step, and what Limora drew. Step 1 now keeps a full-page `before.png` for it.
- **New `scripts/compare-page.mjs`.** It builds that page from the two screenshots and a small `compare.json`: it crops both to the same height, writes WebP (or PNG), and outputs `page.html` to publish as a Claude artifact and `index.html` to open or host anywhere. Plain Node, nothing to install.
- **Old theme setting flagged.** The renderer now prints a note when a reel file still sets `theme`, which was removed in 1.3.1, instead of ignoring it silently.

## 1.3.1 (2026-11-25)

- Removed the indigo "limora" video theme (`theme` option, `--theme` flag, its stars, glow and grain). Every reel now uses the light grey stage.

## 1.3.0 (2026-11-25)

Fixes from the Ridgeway test run (a landing page with 12 image slots).

- **Scenes no longer copy the hero.** Card covers and other scenes are drawn without a reference image: the style travels through the repeated style sentence, and each scene is described as clearly different. A reference is only used for objects (step pictures, empty states), where it can't copy a whole scene. Every call sets `aspect_ratio`, and the agent checks the returned shape.
- **Fixes always ask first.** A drifted image is shown with what's wrong, and a fix runs only after a yes, since the confirmed plan is the budget. In auto mode, drifted images are listed in the report instead of being fixed.
- **The scripts need nothing installed.** `split-sheet.mjs` and `sample-color.mjs` now run on plain Node with a built-in PNG reader and writer (`scripts/png.mjs`), with no Playwright. They take 0.1 to 1 second instead of several. Non-PNG input goes through `sips` or `ffmpeg` when available. Only the video renderer still uses Playwright.
- **`--merge` is safe.** It's checked (a fraction between 0.001 and 0.1, default shown). With `--count`, the splitter searches merge values by itself until it finds that many objects. A large value no longer runs for minutes (summed-area lookup).
- **Photo heroes.** `sample-color.mjs` tells a flat edge from a photo or gradient. When the edge isn't flat, it prints the `mask-image` fade to use, and step 6 covers both cases.
- **New `scripts/shrink.mjs`.** It resizes Limora's 4–7 MB PNGs to web sizes and writes WebP when `cwebp` is installed, optimized PNG otherwise. Step 5 gives the sizes per kind (icons 512, cards 1200, hero 2400).
- **Waiting for jobs.** Step 5 gives typical times (1–2 min), says to poll `limora_get_job` about every 30 s, to start a whole batch before polling (the queue runs 4 or 8 at once), and not to script sleep loops.
- **The accent can come from the direction.** It can come from the agreed palette or signature (a trail-marker red), as long as it also shows somewhere in the pictures.
- **Install note.** The README says to start a new session after installing, since an open session won't see the skill and may pick the other `unslop`. It also shows how to update and suggests `/limora-unslop`.
- Scripts print a plain message on errors instead of a stack trace.

## 1.2.0 (2026-11-25)

- **No more two-image limit.** Step 3 lists every image slot on the screen (icons, hero, card covers, step illustrations, empty states, avatars), and step 4 shows them as an image plan with the cost of each, the total and the balance. The user confirms or trims it at the existing stop. That confirmed plan is the budget.
- **Style approved before the rest.** The icon sheet and the hero are drawn and approved first. The remaining images follow, each using the approved hero as a reference and the same style sentence, with matching aspect ratios per kind and a different moment of the product's day in each picture.
- The README and the description now say the skill draws every picture the screen needs.

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
