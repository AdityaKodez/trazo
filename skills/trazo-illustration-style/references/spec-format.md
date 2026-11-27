# Spec format for `build_sticker.mjs`

Use a 256 × 256 canvas with y pointing down and six-digit hex colors.

```json
{
  "id": "pebble",
  "name": "Pebble",
  "category": "nature",
  "tags": ["stone"],
  "seed": 11,
  "rough": 1,
  "parts": [
    {
      "base": "#9eb3c9",
      "outline": 6,
      "shape": { "ellipse": [128, 128, 99, 77, -15] },
      "light": [{ "tone": 2, "shape": { "ellipse": [92, 96, 23, 10, -20] } }]
    }
  ]
}
```

- `id` is required in kebab case and names the output files. `parts` must contain at least one part.
- `category` and `tags` are catalog metadata. Use the target catalog's category ID when importing.
- `seed` changes the deterministic wobble and shading. `rough` adjusts their strength, with 1 as the default. Try 0.6 on geometric subjects or around 1.4 on scribbles.

## Shapes

| Key | Value | Notes |
| --- | --- | --- |
| `ellipse` | `[cx, cy, rx, ry, rotationDeg]` | Blobs and bodies |
| `poly` | `[[x, y], ...]` | Smoothed closed contour. Set `"smooth": false` for sharp corners. |
| `ring` | `[cx, cy, rx, ry, rotationDeg, innerRx, innerRy]` | Ellipse with an elliptical hole |
| `arc` | `[cx, cy, rx, ry, rotationDeg, startDeg, endDeg]` and `width` | Rounded ribbon. Angle 0 is right and 90 is down. |
| `stroke` | `[[x, y], ...]` and `width` | Rounded ribbon. Use a number or `[start, end]` to taper. Set `"smooth": false` for straight segments. |

Use one shape key per shape object. Add `"holes": [shape, ...]` for interior cutouts. A part's `shape` can be an array of shape objects, which the builder unions before painting. For a thick mark that crosses itself, union multiple simple ribbons to keep the intersection filled.

## Parts

- `base` is required. Parts draw in array order and later parts cover earlier ones.
- `outline` controls edge width, with a default of 6. Set it to 0 to disable the outline. Use smaller values on thin parts.
- `light` and `shade` are optional arrays of `{ "tone": 1, "shape": { ... } }` regions. Tones 1–3 bias the automatic lighting field, with 3 the strongest. Regions influence the quantized lighting inside a part. For an exact flat shape and fill, use a detail or a flat part.
- `palette` overrides named fill colors `light1`, `light2`, `light3`, `shadow1`, `shadow2`, `shadow3`, `outline1`, `outline2`, `halo`, and `accent`. Set explicit highlights for very dark bases when the default ramp looks too bright.
- `fringe` controls the pale edge band's width. Set it to 0 to disable it. `accent: false` removes the automatic accent patch. `castShadow: false` disables shading cast by later parts onto this part.
- For single-color scribbles use one part with `"depth": 0, "fringe": 0, "outline": 0` and omit lighting patches. `depth: 0` with no patches turns off shading. A flat part can still use an outline.

## Faces and details

```json
"face": { "cx": 128, "cy": 120, "gap": 34, "size": 1, "blush": "#f8b399" }
```

The face expands to two eyes and two blush ovals. Set `blush: false` to remove blush, `size` to scale the features, or `eye` to set the eye color. For asymmetric poses, use individual shapes in `details`. Each detail has a `fill` and a `shape` and draws on top of the painted parts with a light wobble. Draw essential single-ink marks separately in `ink`.

## Single-ink geometry

Set the top-level `ink` array to the shapes that carry pigment in the recolored sticker. Use a ring or an outer contour with `holes` for transparent interiors. Add `stroke` or `arc` shapes for seams and identifying details. The builder unions these shapes into one even-odd `d` path. The ink uses the painted artwork's fit and anchor so both modes stay aligned.

```json
{
  "ink": [
    { "ring": [128, 128, 91, 95, -12, 82, 86] },
    { "stroke": [[95, 136], [116, 155], [159, 105]], "width": 10 }
  ]
}
```

Use the local catalog as the ink reference. In the Trazo repository, render the matching catalog definition and the generated `.sticker.json` with `toSvgString(def, { color: "#1f1e1b" })` from `packages/trazo/src/core.ts`. A standalone recolorable SVG uses the definition's single `d` path with `fill-rule="evenodd"` and `fill="currentColor"`. Check that interior voids show the actual background, and keep only the marks that identify the object at its intended size.

Omitting `ink` keeps the builder's default union of painted parts. Use that fallback for solid marks and simple scribbles whose filled silhouette already carries the drawing.

## Build and verify

For an early small-size check, preview a temporary copy of the spec with `depth: 0` and `fringe: 0` on its parts and omit their `light` and `shade` arrays. Keep defining parts, cutouts, and their fill and outline colors. Omit ornamental details. Render at the smallest intended size before adding tonal patches.

The builder requires Node 18 or newer. By default it centers and fits the artwork and prints the fit scale. If it falls outside 0.75–1.35, redraw closer to the target canvas to keep authored widths representative. Use `--no-fit` on related states drawn with the same canvas anchor so each state keeps its authored position and scale. Check the edges for clipping.

- `<id>.svg` is the standalone layered SVG.
- `<id>.sticker.json` is the catalog definition. Its `layers` are the painted artwork and `d` is the single-ink drawing. Inspect both renderings before importing.
- `--png` writes a 768 px white-background preview when `sharp` resolves from the working directory. For a set, use the [contact sheet](visual-review.md#render-a-sheet). For a single draft, open the preview or render the SVG in a browser to check both the close-up and intended size.
