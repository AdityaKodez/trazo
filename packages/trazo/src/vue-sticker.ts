import { h, type FunctionalComponent } from "vue";

import {
  getViewBoxCenter,
  normalizeRotation,
  shouldUseLayers,
  type StickerDef,
} from "./core";

interface VueStickerProps {
  size?: number | string;
  color?: string;
  rotate?: number;
  title?: string;
}

const stickerProps = {
  size: [Number, String],
  color: String,
  rotate: Number,
  title: String,
};

export function createVueSticker(def: StickerDef): FunctionalComponent<VueStickerProps> {
  const [centerX, centerY] = getViewBoxCenter(def.viewBox);

  const Sticker: FunctionalComponent<VueStickerProps> = ({ size = 48, color, rotate, title }) => {
    const ink = color?.trim();
    const rotation = normalizeRotation(rotate);
    const layers =
      def.layers && shouldUseLayers(def, ink)
        ? def.layers
        : [{ d: def.d, fill: ink || "currentColor" }];
    const paths = layers.map((layer) =>
      h("path", { d: layer.d, fill: layer.fill, "fill-rule": "evenodd" }),
    );
    const artwork =
      rotation !== 0
        ? h("g", { transform: `rotate(${rotation} ${centerX} ${centerY})` }, paths)
        : paths;

    return h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: def.viewBox,
        width: size,
        height: size,
        fill: "none",
        overflow: rotation !== 0 ? "visible" : undefined,
        role: title ? "img" : undefined,
        "aria-label": title || undefined,
        "aria-hidden": title ? undefined : "true",
      },
      [title ? h("title", title) : null, artwork],
    );
  };
  Sticker.props = stickerProps;
  Sticker.displayName = def.componentName;
  return Sticker;
}
