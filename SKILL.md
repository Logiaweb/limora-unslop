---
name: limora-unslop
description: Unslops an AI-built app or site with real visuals and gives it its own visual world. Finds the one true detail about how the product is used, agrees a direction with the user, generates a matching icon set and hero banner with Limora, then rebuilds the screen around those assets so it looks drawn for this product and nobody else. Trigger it when someone wants a design unslopped, says their app looks AI-generated, generic, vibecoded or like every other template, asks for custom icons, illustrations or a hero image, or wants a dashboard, app or landing page to feel designed. Handles React, Tailwind and plain HTML/CSS projects, and can start from a codebase, a website address or an image of the screen.
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

> The visuals step draws your icons and banner with Limora, an AI image tool for designers.
> 1. Create a free account: https://limora.ai. New accounts get enough credits for one icon set and one banner.
> 2. Connect it. In Claude Code, run: `claude mcp add --transport http limora https://app.limora.ai/mcp`. In Claude.ai or Claude Desktop, add a custom connector with the URL `https://app.limora.ai/mcp`.
> 3. Tell me when it's done and I'll draw your set.

If the user doesn't want Limora, finish steps 6 and 7 with the assets they already have, and say plainly that the screen will still use generic icons.

## 1. Get the screen in front of you

Judge the screen by how it renders, never by reading the code alone.

- **A codebase:** locate the components behind the screen, start the dev server (or open the HTML) and grab a screenshot.
- **A website address:** download the page into a local HTML copy and do every edit there. Run `limora_preview_website_brand` on the address too, so you start with its logo and colors.
- **Only an image:** recreate the screen in a single HTML file, matching it as closely as you can. That file becomes your starting point.

When you started from an address or an image, explain in the report that the output is a mock-up in code, ready to pass to the developer of the real site.

## 2. Find the insight

Read what the screen says the product does. Then answer three questions in one line each:

- **Who** uses it, in plain words. "A bakery owner", not "SMBs".
- **When and where** they use it. This is usually where the idea is. Bakers work at 3am, so a bakery dashboard can live at night. A travel app is opened in a queue at the airport.
- **What objects** fill their day. A bakery has a rolling pin, a cargo bike, a bread box and an oven. A design tool has pencils, swatches and a cutting mat.

The objects become the icons. The when and where becomes the banner scene. The idea comes from the product's real life, not from design trends.

## 3. Name what's borrowed

Write down each borrowed part and where it sits on the screen. The usual suspects:

- Icons from a stock icon library, or emoji used as icons.
- A hero or banner made only of a gradient, glow or blurred blobs.
- Empty states with nothing in them but grey text.
- Stat cards that are all identical, with no picture or hierarchy.
- Colors that have nothing to do with the product (purple and blue on a bakery).
- Copy that could sit on any product ("Supercharge your workflow ✨").
- Neon glows, gradient text and pulsing dots on things that aren't live.

If the screen is already designed and only a few parts are borrowed, say so, keep its style, and only replace those parts.

## 4. Agree a direction (stop and wait)

Write three or four directions. Each one is a short block:

- **Name:** two words that sound like the product's daily life.
- **Palette:** page color, two or three illustration colors, and one accent for actions.
- **Drawing:** outline weight, shading and shape, in one line.
- **Type:** one heading face and one text face, by style.
- **Banner:** the scene in one sentence, with the side kept empty for the headline.
- **Sample icon:** one object, described.
- **Signature:** a tiny recurring detail that belongs to this business alone (steam curls over anything fresh, a ticket stub for each order).

Make the directions genuinely different in mood. One safe, one crafted, one playful, and one that comes straight from the insight (the night shift).

Ask the user to pick, using the question tool if you have one. Once they pick, find **one real reference** for the drawing style. Use a Mobbin or Details MCP if one is connected, otherwise describe a well-known product that draws this way. Copy the reference's *approach* (line, shading, color mix, how objects sit on tiles), never its drawings.

Don't skip this stop unless the user already said "just do it". Changing direction after the images exist costs credits.

## 5. Draw the set with Limora

The core set is two images. Announce the credit cost before each generation, and don't add images on your own.

1. **Project:** use the user's Limora project for this product if one exists (`limora_list_projects`). Otherwise create one (`limora_create_project`), from the site URL when there is one.
2. **Icon set:** one image with **exactly 6 objects**, from step 2, in the chosen style, each on its own with space between them. Write the reference's approach into the prompt: line weight, shading, shadow, color variety.
3. **Banner:** one wide image with the scene, the empty side flat and calm enough for a headline, in the same style as the icons.
4. **Show both to the user** and compare them with the reference out loud: outline, shadow, color, count. Suggest at most one fix per image and run it with `limora_iterate_image` only if the user says yes. Never call `limora_generate_image` again to fix an image you already have.
5. **Split the icons** with `limora_split_icon_set`. Open every file and check it holds exactly one object. If one holds two, cut it locally from the sheet instead.
6. If the icons will sit on colored tiles, they can stay as drawn. If they need to float on any background, use `limora_remove_background`.

Store the files next to the app's other images, named after what they show (`orders.png`, `banner.png`).

## 6. Rebuild the screen around the assets

Keep the product's features, content and section order. Change how it looks.

- **Icons everywhere the product names a thing:** the navigation, the stat tiles, the quick actions and the empty states. Spare icons from the set make the best empty states (a rolling pin for "No special orders tomorrow").
- **Banner on top**, with the headline and at most two buttons on its empty side. Match the page's background to the banner's empty side exactly, so there's no seam.
- **One accent color, taken from the banner.** Use it for the main action and the active state, and nothing else.
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
- The Limora credits used and the balance left, with a link to the project.
- Next ideas the user might want, like a second icon set for settings or an animated banner, with their cost.

## 9. Make the share video

To finish, make a short video of the screen fixing itself, made to be posted. Offer it right after the report and build it unless the user says no. It costs no credits.

What it shows, in order:
- **The scan.** A highlighter line runs down the old screen and tags 3 to 5 of the worst borrowed parts in yellow.
- **The checklist.** One pill per step across the top. Each one ticks as its change lands, and the screen changes in place underneath, with no cut.
- **The Limora moments.** The icons pop in one after another and the banner wipes open, with a small "drawn with Limora" note above.
- **A quick before and after**, then an end card that says "Unslopped with limora-unslop".

How to build it:

1. **Copy the template.** Copy `video/template.html` from this skill's folder into `limora-unslop-reel/reel.html` in the project, and copy the new assets next to it.
2. **Put the old screen in.** Paste the original screen's markup inside the `id="screen"` element, with its styles. This is the starting state.
3. **Write each step as rules on top.** Each step's id is a word that gets added to `#screen[data-done]` when its pill ticks. Write that step's changes under `[data-done~="<id>"]`. The rules stack, so later steps keep the earlier ones. Change values like padding, colors, sizes, radius and opacity, never the structure, so everything can tween.
4. **Add the hooks.** These are listed at the top of the template: `data-flag`, `data-gone`, `data-arrive`, `data-reword`, `data-pop`, `data-reveal` and `data-play`. Put `data-pop` on every Limora icon and `data-reveal` on the banner. Keep `data-reword` for lines whose wording is different, eight of them at most.
5. **Fill in `window.REEL`.** Use 5 to 9 steps with honest counts of what changed. Add `note` on the Limora steps and `focus` on the banner step so the camera pushes in. The `credit` is the user's handle if they gave one.
6. **Pick the format.** The default is 1440x1080. For a vertical post, use `size: [1080, 1350]`, and use a screen that's taller than it is wide, or the device will look small. The `limora` theme puts the screen on Limora's indigo background.
7. **Render.** Run `node <skill folder>/video/render.mjs limora-unslop-reel/reel.html limora-unslop-reel/unslop.mp4`. To check the frames first, add `--stills 2,8,15` instead of the output name, or use `--play` to open a window that plays it. Playwright and ffmpeg must be installed. If one is missing, give the user the one install command the script prints.
8. **Check the frames before sharing.** Check stills from the scan, one step mid-change, the banner and the end card. Fix anything that jumps, overlaps or doesn't move.

The reel file is only for the video. The actual redesign is delivered in the app's normal stack, free of `data-done` rules and hooks.
