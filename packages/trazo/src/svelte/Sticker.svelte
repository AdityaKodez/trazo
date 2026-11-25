<script lang="ts">
  import {
    getViewBoxCenter,
    normalizeRotation,
    shouldUseLayers,
    type StickerDef,
  } from "../core.js";
  import type { SvelteStickerProps } from "../svelte-sticker.js";

  let {
    def,
    size = 48,
    color,
    rotate = 0,
    title,
    overflow,
    ...props
  }: SvelteStickerProps & { def: StickerDef } = $props();

  const ink = $derived(color?.trim());
  const rotation = $derived(normalizeRotation(rotate));
  const center = $derived(getViewBoxCenter(def.viewBox));
  const layers = $derived(
    def.layers && shouldUseLayers(def, ink)
      ? def.layers
      : [{ d: def.d, fill: ink || "currentColor" }],
  );
</script>

{#snippet artwork()}
  {#each layers as layer}
    <path d={layer.d} fill={layer.fill} fill-rule="evenodd" />
  {/each}
{/snippet}

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox={def.viewBox}
  width={size}
  height={size}
  fill="none"
  overflow={overflow ?? (rotation !== 0 ? "visible" : undefined)}
  role={title ? "img" : undefined}
  aria-label={title || undefined}
  aria-hidden={title ? undefined : true}
  {...props}
>
  {#if title}<title>{title}</title>{/if}
  {#if rotation !== 0}
    <g transform={`rotate(${rotation} ${center[0]} ${center[1]})`}>
      {@render artwork()}
    </g>
  {:else}
    {@render artwork()}
  {/if}
</svg>
