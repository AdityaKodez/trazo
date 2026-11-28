"use client";

import type { ComponentType, ReactNode } from "react";

import { overlayDrawerClass } from "@/components/trazo/overlay-layout";
import type { OverlayView } from "@/components/trazo/trazo-experience";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export type OverlaySlotComponent = ComponentType<{
  className?: string;
  children: ReactNode;
}>;

export interface OverlayMobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overlayView: OverlayView;
  renderBody: (slots: {
    Title: OverlaySlotComponent;
    Description: OverlaySlotComponent;
  }) => ReactNode;
}

function OverlayDrawerHeading({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <DrawerTitle asChild className={className}>
      <h1>{children}</h1>
    </DrawerTitle>
  );
}

export function OverlayMobileDrawer({
  open,
  onOpenChange,
  overlayView,
  renderBody,
}: OverlayMobileDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          overlayDrawerClass,
          overlayView === "grid" ? "h-[84dvh]" : "max-h-[90dvh]",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col pt-1">
          {renderBody({
            Title: OverlayDrawerHeading,
            Description: DrawerDescription,
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
