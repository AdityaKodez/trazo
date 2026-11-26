import type { SVGProps } from "react";
import type iconWeights from "@/config/site-icon-weights.json";

type SiteIconName = keyof typeof iconWeights;
type SiteIconProps = SVGProps<SVGSVGElement> & { size?: number | string };

const CORE_HOME_ICONS = new Set<SiteIconName>([
  "ArrowUpRight",
  "Check",
  "Copy",
  "Languages",
  "LayoutGrid",
  "X",
]);

export function createSiteIcon(name: SiteIconName) {
  const href = CORE_HOME_ICONS.has(name)
    ? `/ui-icons/sprite.svg#${name}`
    : `/ui-icons/overlay-sprite.svg#${name}`;

  return function SiteIcon({ size = 24, color = "currentColor", ...props }: SiteIconProps) {
    return (
      <svg width={size} height={size} viewBox="0 0 256 256" fill={color} aria-hidden="true" {...props}>
        <use href={href} />
      </svg>
    );
  };
}
