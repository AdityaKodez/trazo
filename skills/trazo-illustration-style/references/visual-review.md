# Visual review

Use this loop for every sticker draft—standalone stickers, coordinated sets, and UI replacements alike.

1. **Render the actual SVGs.** Make a labeled contact sheet with the close-up and each intended display size on light and dark backgrounds. Use 96 px for the close-up and, if sizes are unspecified, 36 px and 16 px as thumbnail checks. Pair adjacent states on the sheet or show them together in a placement capture. Include a real UI screenshot when a badge, label, or another element affects how the illustration reads.
2. **Attach visible images.** Start a fresh subagent with context forking disabled using the [inspector prompt](inspector-prompt.md). Attach the rendered Trazo references first, then the draft sheet and any placement captures. Use image attachments, with plain subject labels, dimensions, intended states, and any adjacent UI label. Distinguish diagnostic sheet captions from labels that actually appear next to the artwork in use. The inspector gets images and captions only. If an attachment fails to render, resend it before relying on the critique. If independent image review is unavailable, do the same visual checks yourself and disclose the fallback.
   When a standalone icon is easy to misread, first attach an unlabeled sheet at the smallest intended size, without the close-ups or subject names. Ask the fresh inspector what each row resembles. Share the subjects and labeled sheet after that first read, then use the same reviewer for revisions. Use the actual placement when an in-product label is meant to supply the subject.

3. **Revise blocker by blocker.** Ask what each failed sticker currently resembles and which visual cue would fix it. Fix the silhouette, defining features, and overlaps before tuning shade patches. Keep approved artwork intact. Re-render the full set with the same sizes, themes, and order, then send the new sheet to the same reviewer.
4. **Finish on evidence.** Stop when the current renders have no actionable blocker at the intended size and the affected UI checks pass. If you hit a limit, identify the unresolved objection, sticker, and size in the handoff.

## Render a sheet

Run the bundled helper from a directory where `sharp` resolves. Pass the sheet path, comma-separated pixel sizes, and the SVGs in display order. Labels come from file names. Put `--unlabeled` before the sheet path to hide subject labels while keeping size and background markers. The output uses a white and a charcoal panel, with each sticker raster at the requested pixel size.

```text
node <skill-dir>/scripts/render_review_sheet.mjs <out-dir>/review.png 96,36,16 <out-dir>/watering-can.svg <out-dir>/snail.svg
```

If `sharp` is unavailable, assemble the same grid using the SVGs in a browser and capture at device scale 1. Use placement screenshots for exact product background and layout. Open the finished sheet and inspect the listed pixel sizes without zoom before sending it to the reviewer.