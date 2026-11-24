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

The face expands to two eyes and two blush ovals. Set `blush: false` to remove blush, `size` to scale the features, or `eye` to set the eye color. For asymmetric poses, use individual shapes in `details`. Each detail has a `fill` and a `shape` and draws on top of the parts with a light wobble. Use a part for a feature that must contribute to the single-color silhouette.

## Build and verify

For an early small-size check, preview a temporary copy of the spec with `depth: 0` and `fringe: 0` on its parts and omit their `light` and `shade` arrays. Keep defining parts, cutouts, and their fill and outline colors. Omit ornamental details. Render at the smallest intended size before adding tonal patches.

The builder requires Node 18 or newer. By default it centers and fits the artwork and prints the fit scale. If it falls outside 0.75–1.35, redraw closer to the target canvas to keep authored widths representative. Use `--no-fit` on related states drawn with the same canvas anchor so each state keeps its authored position and scale. Check the edges for clipping.

- `<id>.svg` is the standalone layered SVG.
- `<id>.sticker.json` is the catalog definition. Its `d` is the union of the painted parts and retains their visible cutouts. The layered rendering also includes details. Inspect the single-color rendering before importing.
- `--png` writes a 768 px white-background preview when `sharp` resolves from the working directory. For a set, use the [contact sheet](visual-review.md#render-a-sheet). For a single draft, open the preview or render the SVG in a browser to check both the close-up and intended size.