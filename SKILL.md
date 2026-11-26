---
name: limora-unslop
description: limora-unslop (not the code-polish skill named "unslop" by heydamir) unslops an AI-built app or site with real visuals drawn in Limora and gives it its own visual world. Finds the one true detail about how the product is used, agrees a direction with the user, draws every picture the screen needs with Limora (icons, hero, card images, step illustrations, empty states), then rebuilds the screen around those assets so it looks drawn for this product and nobody else. Trigger it when someone wants a design unslopped, says their app looks AI-generated, generic, vibecoded or like every other template, asks for custom icons, illustrations or a hero image, or wants a dashboard, app or landing page to feel designed. Handles React, Tailwind and plain HTML/CSS projects, and can start from a codebase, a website address or an image of the screen. If another skill called unslop is installed and the user names limora-unslop, Limora, or wants icons and a banner drawn, use this one.
license: MIT
metadata:
  author: Adrien Ninet
  site: https://limora.ai
---

# Limora Unslop

AI-built screens look alike for one main reason: they're all made of borrowed parts. The icons come from the same icon library, the hero is a gradient, the empty states are empty, and the stat cards are copies of each other. Tidying the spacing helps, but the screen still belongs to nobody.

Products people remember have their own pictures. Airbnb draws real objects instead of symbols. Its empty states show a scene, and the rest of the UI stays quiet so the drawings carry the page. This skill does the same for any product. It finds the product's world, draws it with Limora, and rebuilds the screen around the drawings.

The rule behind everything: **the chrome stays quiet, the pictures carry the character.** Navigation, buttons, cards and text use calm neutrals and one accent. The drawings get all the color and the attention.

## Before you start: check Limora

Call `limora_whoami`.

- **Connected:** note the credit balance and carry on.
- **Not connected:** do the reading and direction steps anyway (they are free), then show this message at the start of step 5 and wait:

> The visuals step draws your screen's pictures with Limora, an AI image tool for designers.
> 1. Create a free account: https://limora.ai/?utm_source=limora-unslop&utm_medium=skill New accounts get enough credits to start with the icons and the hero.
> 2. Connect it. In Claude Code, run: `claude mcp add --transport http limora https://limora.ai/mcp`. In Claude.ai or Claude Desktop, add a custom connector with the URL `https://limora.ai/mcp`.
> 3. Tell me when it's done and I'll draw your set.

If the user doesn't want Limora, finish steps 6 and 7 with the assets they already have, and say plainly that the screen will still use generic icons.

## Before you start: references (optional)

Real references make the rebuild clearly better, so ask for them up front.

- **Look for a reference tool** among your connected tools: Refero, Mobbin, Details, or any similar design-reference MCP. If one is connected, say so and use it.
- **If none is connected, ask once:** "Do you have a design reference tool connected, like Refero or Mobbin? Collecting real references first makes the rebuild noticeably better." If the user says no or skips it, carry on without references.
- **Collect after step 2**, once you know what the product is and what kind of screen this is. Search for:
  - 4 to 8 real products in the same space and of the same kind of screen ("freelancer finance landing page", "bakery operations dashboard").
  - 2 or 3 for each section that matters most on this screen (pricing, feature cards, empty states, onboarding steps).
- **Show them** as numbered links with one line each on what it does well (layout, hierarchy, how pictures sit in the page, type), and let the user keep the ones they like. Some tools have usage limits, so search with purpose rather than many times.
- **Use the kept ones:** they feed the directions in step 4 and the layout and hierarchy in step 6. Take their *approach* (section order, spacing rhythm, how images are framed, how much text sits next to a picture), never their screens, copy, logos or illustrations.

## 1. Get the screen in front of you

Judge the screen by how it renders, never by reading the code alone.

- **A codebase:** locate the components behind the screen, start the dev server (or open the HTML) and grab a screenshot.

Keep a full-page screenshot of the original at 1440 px wide (`before.png`). Step 10 compares it with the result.
- **A website address:** download the page into a local HTML copy and do every edit there. Run `limora_preview_website_brand` on the address too, so you start with its logo and colors.
- **Only an image:** recreate the screen in a single HTML file, matching it as closely as you can. That file becomes your starting point.

When you started from an address or an image, explain in the report that the output is a mock-up in code, ready to pass to the developer of the real site.

## 2. Find the insight

Read what the screen says the product does. Then answer three questions in one line each:

- **Who** uses it, in plain words. "A bakery owner", not "SMBs".
- **When and where** they use it. This is usually where the idea is. Bakers work at 3am, so a bakery dashboard can live at night. A travel app is opened in a queue at the airport.
- **What objects** fill their day. A bakery has a rolling pin, a cargo bike, a bread box and an oven. A design tool has pencils, swatches and a cutting mat.

The objects become the icons. The when and where becomes the banner scene, and the other moments of their day become the rest of the pictures. The idea comes from the product's real life, not from design trends.

## 3. Name what's borrowed

Write down each borrowed part and where it sits on the screen. The usual suspects:

- Icons from a stock icon library, or emoji used as icons.
- A hero or banner made only of a gradient, glow or blurred blobs.
- Empty states with nothing in them but grey text.
- Image areas filled with a gradient, a placeholder or a big emoji: card covers, step illustrations, feature visuals, avatars.
- Stat cards that are all identical, with no picture or hierarchy.
- Colors that have nothing to do with the product (purple and blue on a bakery).
- Copy that could sit on any product ("Supercharge your workflow ✨").
- Neon glows, gradient text and pulsing dots on things that aren't live.

If the screen is already designed and only a few parts are borrowed, say so, keep its style, and only replace those parts.

Then list the **image slots**: every place on the screen where a real picture would do better than what's there. A landing page often has a dozen (icons, hero, three cards, three steps, an empty state, a footer scene); a phone screen may have three. This list is what step 5 draws, so don't cap it.

## 4. Agree a direction (stop and wait)

Write three or four directions. If you collected references, ground each direction in one or two of them and name which. Each one is a short block:

- **Name:** two words that sound like the product's daily life.
- **Palette:** page color, two or three illustration colors, and one accent for actions.
- **Drawing:** outline weight, shading and shape, in one line.
- **Type:** one heading face and one text face, by style.
- **Banner:** the scene in one sentence, with the side kept empty for the headline.
- **Sample icon:** one object, described.
- **Signature:** a tiny recurring detail that belongs to this business alone (steam curls over anything fresh, a ticket stub for each order).

Under the directions, show the **image plan**: one line per image from your step 3 slots, what it shows, and its cost (usually 4 credits each; an icon sheet counts as one image for up to 6 icons). Give the total and the balance from `limora_whoami`. Put the icon sheet and the hero first, since they carry the most. If the balance doesn't cover everything, say which images fit and let the user choose. The user can remove images or add more here.

Make the directions genuinely different in mood. One safe, one crafted, one playful, and one that comes straight from the insight (the night shift).

Ask the user to pick a direction and confirm the image plan, using the question tool if you have one. Once they pick, find **one real reference** for the drawing style: from the references you collected at the start if one fits, otherwise from the reference tool if one is connected, otherwise describe a well-known product that draws this way. Copy the reference's *approach* (line, shading, color mix, how objects sit on tiles), never its drawings.

Don't skip this stop unless the user already said "just do it". Changing direction after the images exist costs credits. The confirmed plan is the budget: generate what's in it, and ask before adding anything else.

## 5. Draw the set with Limora

Draw the confirmed image plan, in its order. Say the running total as you go. This skill's scripts live in `scripts/` next to this file. They are plain Node with nothing to install, so they run in any project.

**Waiting for images.** A generation takes about 1 to 2 minutes. `limora_generate_image` returns either the finished image or a job; poll a job with `limora_get_job` about every 30 seconds. Start every image of a batch before polling: the queue runs 4 at a time on Starter and 8 on Pro, so a batch of 8 takes about as long as one. Don't script a sleep loop (many hosts block it); keep working on the page between checks, or simply call `limora_get_job` again.

1. **Project:** use the user's Limora project for this product if one exists (`limora_list_projects`). Otherwise create one (`limora_create_project`), from the site URL when there is one.
2. **Icon sheet: pick the right call.**
   - `asset_type: "icon_set"` is a template with its own composition and style rules. It is right for flat, line or glyph icons, and it is the only kind `limora_split_icon_set` can cut. It tends to override the count and the style you write.
   - **For 3D, clay, painted, sketched or illustrated objects, use a free prompt** (no `asset_type`), with `transparent_background: true` and `aspect_ratio: "3:2"`. This prompt pattern holds the count and the style:

     > A sprite sheet of exactly 6 separate objects in a 3 by 2 grid, with wide empty space around each one, nothing touching and nothing cropped: 1) …, 2) …, 3) …, 4) …, 5) …, 6) …. Style: (the direction's drawing line, e.g. soft matte clay 3D, rounded shapes, no outlines). Same light from the top left, same camera angle and the same size for every object. No text, no labels, no frames, no ground, no background scene.

   - **Check before showing it:** count the objects and compare the style with the direction (outlines, shading, colors). If either is off, show it, say what's wrong, and ask before running a `limora_iterate_image` fix (4 credits). Fixes are outside the confirmed plan, so they always need a yes.
   - While a job runs, its reported settings can lag (a transparent request can show `transparent_background: false`). Trust only the finished job (`limora_get_job`).
3. **Hero:** one wide image with the scene, the empty side flat and calm enough for a headline, in the same style as the icons.
4. **Approve the style before the rest.** Show the icon sheet and the hero, and compare them with the reference out loud: outline, shadow, color, count. Suggest at most one fix per image and run it with `limora_iterate_image` only if the user says yes. Never call `limora_generate_image` again to fix an image you already have. Don't start the rest of the plan until these two are approved, so a wrong style is caught after 2 images, not 12.
5. **The rest of the plan:** card images, step illustrations, empty states, feature visuals, avatars. One `limora_generate_image` each (with `new_image: true`, since each one is a separate picture). To keep the set one family:
   - **Scenes (card covers, other landscapes or rooms): no reference image.** A reference makes the model copy the hero almost as is (the same hut, the same framing) and can bring back the hero's shape instead of the one you asked for. Keep the family through words: repeat the hero's style sentence word for word (medium, light, palette, line), then describe a scene that is clearly different.
   - **Objects (step pictures, empty states, spot illustrations): the approved icon sheet or hero as `reference: { asset_id }` helps,** because a small object can't copy a whole scene. Still repeat the style sentence.
   - Set `aspect_ratio` on every call, the same for every image of the same kind (all three cards `4:3`, all steps `1:1`), and check the returned size: if a card came back in the hero's shape, it was copied, so say so.
   - Make each picture show something different from that part of the product's day, never the hero again with small changes. Three trip cards are three different places; three steps are three different moments.
   - Spot pictures that sit on the page (steps, empty states) usually want `transparent_background: true`; covers and scenes that fill a frame don't.
   - Check each one against the hero before moving on: style, shape, and that it isn't the hero again. If one drifts, show it and ask before a `limora_iterate_image` fix (4 credits): the plan is the budget, and a fix is an addition. In an auto or unattended mode, list the drifted images in the report instead of fixing them on your own.
6. **Split the icons.**
   - A sheet made with `asset_type: "icon_set"` and never edited: `limora_split_icon_set` (1 credit).
   - Anything else (a free-prompt sheet, or any sheet after `limora_iterate_image`, which loses the icon_set type and is refused with "Only for icon sets"): download the sheet and cut it locally, for free:

     `node <skill folder>/scripts/split-sheet.mjs sheet.png assets/icons --names orders,bakes,deliveries,stock,pickups,takings --count 6`

     It finds each object (by transparency, or by the sheet's background color), pads it to a square and writes one PNG per object, top row first. With `--count` it tries other merge distances by itself until it finds that many objects, so leave `--merge` out. Only if it still warns, set `--merge` by hand: a fraction of the sheet's width between 0.001 and 0.1 (default 0.02), lower when two objects came out as one, higher when one came out in pieces.
   - Open every file and check it holds exactly one whole object.
7. If the icons will sit on colored tiles, they can stay as drawn. If they need to float on any background and the sheet wasn't transparent, use `limora_remove_background`.

Limora returns full-size PNGs of 4 to 7 MB each, so a set of 12 weighs 60 MB or more. Shrink them before they go into the app, and keep the originals out of it:

`node <skill folder>/scripts/shrink.mjs originals/*.png --out-dir public/images --max 1600`

Use `--max 512` for icons, 1200 for cards and step pictures, 2400 for a full-width hero. It writes WebP when `cwebp` is installed and optimized PNG otherwise. Name the files after what they show (`orders.webp`, `hero.webp`).

## 6. Rebuild the screen around the assets

Keep the product's features, content and section order. Change how it looks. If the user kept references at the start, follow their layout and hierarchy approach for each section.

- **Every image in its slot:** card covers fill their frame edge to edge, step illustrations sit above their step, the empty-state scene replaces the grey sentence.
- **Icons everywhere the product names a thing:** the navigation, the stat tiles, the quick actions and the empty states. Spare icons from the set make the best empty states (a rolling pin for "No special orders tomorrow").
- **Banner on top**, with the headline and at most two buttons on its empty side. Measure its empty side, since image models drift from the hex you asked for: `node <skill folder>/scripts/sample-color.mjs hero.png --side left` prints the real hex and says whether that side is flat.
  - **Flat** (an illustration with a calm empty side): set the background behind the hero to that exact hex, never the one from the prompt, and the seam disappears.
  - **Not flat** (a photo, a sky, a gradient): no single color can match it. Set the background to the printed hex and fade the image's edge into it with the `mask-image` line the script prints.
- **One accent color**, from the drawings or from the direction you agreed (its palette or signature, like a trail-marker red). If it doesn't appear in the hero, make sure it shows somewhere in the pictures (the icons, a card) so it doesn't feel pasted on. Use it for the main action and the active state, and nothing else.
- **Neutrals tinted toward the banner's palette**, not pure grey. Text, borders and cards all come from those tints.
- **Calm chrome:** no glows, no gradient text, no emoji labels, no pulsing dots unless something is really live. Shadows are soft, or the reference's hard offset shadow, used the same way everywhere.
- **A spacing scale** of 4, 8, 12, 16, 24, 32, 48 and 64px, and nothing in between.
- **Type:** the two faces from the direction, at most five sizes.
- **Copy:** specific to the product and short. "Good morning, Léa. 142 orders today." beats "Welcome back! 👋".
- **Data that tells one story:** the orders, the schedule and the deliveries refer to each other (Café Lumen's 40 croissants come out of the 6:00 batch).

## 7. Motion (optional)

Ask before spending credits on it.

- **Ambient details** (steam, a flame, a swaying lamp, a blinking cursor) are cheap and safe in CSS on top of the still image.
- **A character moving** (a baker sliding bread into the oven) needs a video model (`limora_generate_video`). Don't fake it by animating a vectorized illustration: it breaks into hundreds of loose shapes and leaves holes when parts move.
- Crop the banner to the model's format before sending it. Some models only take up to 2.5:1, others only 16:9. Crop from the empty side so the scene stays whole.
- Show the still image until the video loads, loop it, and stop all motion for people who turn on reduced motion.

## 8. Check and report

Screenshot the whole new screen, put it beside the original and walk through your step 3 list. Fix whatever is still borrowed. Keep it to three check renders or fewer.

Then report:

- The insight and the chosen direction, in two lines.
- What replaced each borrowed part.
- Every image drawn, where it went, the Limora credits used and the balance left, with a link to the project.
- Next ideas the user might want, like a second icon set for settings or an animated banner, with their cost.

## 9. Make the share video

To finish, make a short video of the screen fixing itself, made to be posted. Offer it right after the report and build it unless the user says no. It costs no credits.

What it shows, in order:
- **The scan.** A line runs down the old screen and tags 3 to 5 of the worst borrowed parts with purple Limora labels.
- **The checklist.** One pill per step across the top. Each one ticks as its change lands, and the screen changes in place underneath, with no cut.
- **The Limora moments.** The icons pop in one after another, the hero wipes open, and the other pictures (cards, steps, empty states) open in their slots, with a "drawn with Limora" label that counts them.
- **Before and after:** the old screen holds, then a divider is dragged across to reveal the new one. Then an end card says "Unslopped with limora-unslop".

**Length:** aim for 15 to 25 seconds, the range that works for a post. The render prints the duration. To shorten it: merge steps (5 to 7 is enough), set `pace: 0.8`, give quick steps `hold: 1`, leave out the outro hovers, or set `compare: false` (saves about 6 s).

How to build it:

1. **Copy the template.** Copy `video/template.html` from this skill's folder into `limora-unslop-reel/reel.html` in the project, and copy the new assets next to it.
2. **Put the old screen in.** Paste the original screen's markup inside the `id="screen"` element, with its styles. This is the starting state. Prefix every rule with the screen's root class (`.app .btn`, not `.btn`), so a base rule like `.app a { color: inherit }` can't outrank a button's color and hide its text after the color step.
3. **Write each step as rules on top.** Each step's id is a word that gets added to `#screen[data-done]` when its pill ticks. Write that step's changes under `[data-done~="<id>"]`. The rules stack, so later steps keep the earlier ones. Change values like padding, colors, sizes, radius and opacity, never the structure, so everything can tween.
4. **Add the hooks.** These are listed at the top of the template: `data-flag`, `data-gone`, `data-arrive`, `data-reword`, `data-pop`, `data-reveal` and `data-play`. Put `data-pop` on every Limora icon and on spot pictures (step illustrations, empty-state scenes), and `data-reveal` on the hero and on every picture that fills a frame (card covers). Group the extra pictures under one or two steps ("Imagery", "Empty states") so the reel stays short; everything tagged with the same step id opens together. Keep `data-reword` for lines whose wording is different, eight of them at most.
5. **Know what can't tween.** The template's comments show the fix for each:
   - Text going from centered to left-aligned: make the reword a block grid, old text centered, new text left, and tween the container's margin and width.
   - A centered button row going left: keep it `flex-start` and tween its margin-left to 0.
   - An emoji turning into an icon image: center the image with `inset: 0; margin: auto`, never with `left: 50%` and `translateX`, because the pop animation overwrites `transform`.
   - Reworded button labels stay centered on their own (the engine handles it).
6. **Fill in `window.REEL`.** Use honest counts of what changed. Add `note` on the Limora steps with real counts ("9 images drawn with Limora") and `focus` on the hero step so the camera pushes in. The `credit` is the user's handle if they gave one.
7. **Pick the format.** The default is 1440x1080. For a vertical post, use `size: [1080, 1350]`, and use a screen that's taller than it is wide, or the device will look small.
8. **Check the frames.** Run `node <skill folder>/video/render.mjs limora-unslop-reel/reel.html --stills auto --sheet`. It renders the key moments (the scan, each step mid-change, the compare, the end card) at scale 1 into a temp folder and tiles them into one `sheet.png`, so one look checks everything. Fix anything that jumps, overlaps, vanishes or doesn't move. Use `--out-dir` to keep the stills somewhere else, `--play` to see it play in a window.
9. **Render.** `node <skill folder>/video/render.mjs limora-unslop-reel/reel.html limora-unslop-reel/unslop.mp4`. Playwright and ffmpeg must be installed. If Playwright is missing but another project on the machine has it, point to that one instead of installing: `PLAYWRIGHT_DIR=/path/to/that/project node …`. Otherwise give the user the one install command the script prints. To change only the sound later, add `--remix unslop.mp4` with a new output name.

The reel file is only for the video. The actual redesign is delivered in the app's normal stack, free of `data-done` rules and hooks.

## 10. Make the before/after page

The last deliverable is a page anyone can open and drag: a compare slider over the two screenshots, Before / After / Side by side views, what changed and what Limora drew. It costs no credits.

1. **Screenshots.** Use the full-page `before.png` from step 1 and take the same of the new screen (`after.png`), both 1440 px wide.
2. **Data.** Write `limora-unslop-compare/compare.json`:
   - `title`: the product name. `line`: what the screen is, in a few words ("A vibecoded bakery dashboard").
   - `steps`: one entry per reel step, with its `label`, `count`, and one plain line on what changed.
   - `images`: one row per kind of Limora image with its count (icons, hero, card covers, step pictures, empty states).
   - `limora`: one sentence on what was drawn, and in which direction.
3. **Build it.** `node <skill folder>/scripts/compare-page.mjs --before before.png --after after.png --data limora-unslop-compare/compare.json --out limora-unslop-compare`. It crops both screenshots to the same height, shrinks them, and writes `page.html` and `index.html`.
4. **Share it.**
   - If you can publish Claude artifacts, publish `page.html` with `before` and `after` images as its files, titled "<Product> Unslop", and give the user the link. Tell them it stays private until they share it from its Share menu.
   - Otherwise, give them `limora-unslop-compare/index.html` to open, or to host anywhere as a static page.
