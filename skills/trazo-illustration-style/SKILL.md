---
name: trazo-illustration-style
description: Draw, refine, and visually review Trazo-style sticker SVGs from text subjects or existing artwork. Use for standalone doodles, coordinated sets, and UI sticker replacements that should match the Trazo catalog. Skip photos and brand logos.
---

# Trazo illustration style

Draw soft crayon-and-gouache stickers with uneven hand-cut contours, a few flat tonal patches, and darker colored edges. A text subject is enough to begin. If the user supplies artwork, states, or a UI placement, use those to establish what has to read at the final size.

## Prepare

- Open the rendered references for the subject family. See [creatures](assets/reference/creatures-ocean.png), [objects and symbols](assets/reference/objects-and-symbols.png), and [scribbles and line-art cats](assets/reference/scribbles-and-cats.png). Use a closer rendered reference from the Trazo catalog or a user-supplied board when available. Confirm the images rendered before judging style. Report any reference you cannot load.
- For an existing UI, trace shared callers, record the subjects, actual sizes, backgrounds, and interaction states, and capture the current placement. Use the placement to check alignment, contrast, and overlap with adjoining labels or badges.
- Keep editable specs and review renders outside product directories unless the project already has a place for them.

## Draw

- Start with one recognizable silhouette on a transparent `0 0 256 256` canvas. Keep it centered, with the longest dimension roughly 85–90% of the canvas. Choose the one or two features that distinguish the subject from its closest lookalike. If recognition at a small size matters, render the outline and flat base colors at that size on both backgrounds before painting. Widen distinguishing shapes, preserve open gaps, and simplify overlaps until the essential cues survive. If the shape still resembles something else, use one clear action cue. A tilted watering can with visible drops reads more clearly than an upright can with a tiny spray head.
- Use flat filled paths. Build the large parts back to front with rounded, irregular contours, hue-matched edges, upper-left highlights, and lower-right shade. Keep a shared anchor, palette, and silhouette across interaction states, with enough room for each state-defining shape to read. The [spec guide](references/spec-format.md) documents the builder's fit and shading controls.
- Use a small palette, typically one dominant hue per part. Prefer colored outline tones and warm near-black for the darkest details. Give creatures simple eyes or blush when they help the expression. Give inanimate objects faces when the user asks for a character. Draw arrows and other scribbles as a single flat-color mark with a wobbly edge.
- Write the [JSON spec](references/spec-format.md) and run `node <skill-dir>/scripts/build_sticker.mjs <subject.spec.json> --out <dir>`. Use the [black hole spec](references/examples/black-hole.spec.json) for a worked example and the [catalog SVGs](references/examples/) to inspect construction. Draw original contours. Thin parts need less outline, typically 3–4 units versus 5–6 on larger shapes.

## Review and revise

- Open a render of every SVG. For a single standalone draft, a close-up and thumbnail check is usually enough. For a coordinated set, a UI replacement, or a requested independent critique, follow the [visual review workflow](references/visual-review.md). Use the smallest intended size, both themes where applicable, and a close-up that exposes contour and shading defects.
- Fix silhouette, overlaps, visible gaps, and defining features first. Tune tone and texture after the drawing reads. Re-render at the same sizes and preserve artwork that already passes. At tiny labeled sizes, a distinctive, clean shape can carry the artwork while the adjacent text carries the abstract meaning.
- If a draft is placed in a UI, open its normal route at desktop and mobile widths. Check both themes, asset loading, applicable state transitions, accessible names, and badge overlap. Exercise affected pointer, keyboard, and reduced-motion behavior.

Deliver the standalone SVGs and a final preview when useful. Include the optional `.sticker.json` when the artwork is headed for the Trazo catalog, after checking its single-color preview. Identify any unresolved visual issue and the size or state it affects.