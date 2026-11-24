"use client";

import Image from "next/image";
import type { ComponentType, KeyboardEvent, ReactNode } from "react";
import { Pencil } from "scribbles-icons";

import { ArrowUpRight, X } from "@/components/trazo/icons";
import { InstallCommand } from "@/components/trazo/install-command";
import {
  overlayCardClass,
  overlayDialogClass,
  overlayDrawerClass,
  useIsMobile,
} from "@/components/trazo/overlay-layout";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { illustrationSkill } from "@/config/site";
import { usePreviewTheme } from "@/lib/use-preview-theme";
import { cn } from "@/lib/utils";

const examples = [
  { id: "watering-can", name: "Watering can", tilt: "-rotate-6" },
  { id: "snail", name: "Snail", tilt: "rotate-6" },
  { id: "loop-arrow", name: "Loop arrow", tilt: "-rotate-6" },
] as const;

type TextSlot = ComponentType<{ className?: string; children: ReactNode }>;
type CloseSlot = ComponentType<{ asChild?: boolean; children: ReactNode }>;

function SkillContent({
  Title,
  Description,
  Close,
}: {
  Title: TextSlot;
  Description: TextSlot;
  Close: CloseSlot;
}) {
  const previewTheme = usePreviewTheme();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1 px-1.5 pb-1.5 pt-0.5 sm:px-2">
        <Title className="min-w-0 flex-1 px-1 text-base font-semibold tracking-tight text-foreground">
          {illustrationSkill.title}
        </Title>
        <Close asChild>
          <button
            type="button"
            aria-label="Close"
            className="micro-transition flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-background/85 hover:text-foreground active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
          </button>
        </Close>
      </div>
      <div className={overlayCardClass} data-vaul-no-drag="">
        <div
          className={cn(
            "paper-dot-grid flex min-h-24 shrink-0 items-center justify-center gap-2 rounded-xl bg-[color:var(--scribble-paper)] px-2 ring-1 ring-inset ring-foreground/8 sm:min-h-28 sm:gap-3",
            previewTheme === "dark" && "preview-dark",
          )}
          aria-label="Example stickers"
          role="group"
        >
          {examples.map(({ id, name, tilt }) => (
            <Image
              key={id}
              src={`/agent-skills/${id}.svg`}
              alt={name}
              width={64}
              height={64}
              loading="eager"
              className={tilt}
            />
          ))}
        </div>
        <Description className="text-sm leading-relaxed text-muted-foreground">
          Draw original Trazo-style SVGs and check how they read at small sizes.
        </Description>
        <InstallCommand command={illustrationSkill.command} label="Skills.sh" />
        <div className="border-l-2 pl-3">
          <p className="text-xs font-medium text-muted-foreground">Example prompt</p>
          <p className="mt-1 text-sm leading-snug text-foreground">{illustrationSkill.prompt}</p>
        </div>
        <a
          href={illustrationSkill.source}
          target="_blank"
          rel="noopener noreferrer"
          className="micro-transition inline-flex w-fit items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          View skill on GitHub
          <ArrowUpRight className="size-3" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}

function handleOverlayKeyDown(event: KeyboardEvent) {
  const usesLibraryShortcut =
    event.key === "/" ||
    (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey));

  if (usesLibraryShortcut) event.stopPropagation();
}

export function AgentSkillDialog() {
  const isMobile = useIsMobile();
  const trigger = (
    <button
      type="button"
      className="micro-transition flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[14px] px-2.5 text-xs font-medium text-foreground outline-none hover:bg-muted active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
    >
      <Pencil aria-hidden="true" weight="fill" className="size-4 shrink-0" />
      Agent skills
    </button>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent
          className={cn(overlayDrawerClass, "max-h-[90dvh]")}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onKeyDown={handleOverlayKeyDown}
        >
          <div className="flex min-h-0 flex-1 flex-col pt-1">
            <SkillContent Title={DrawerTitle} Description={DrawerDescription} Close={DrawerClose} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={cn(overlayDialogClass, "max-w-[480px]")}
        onKeyDown={handleOverlayKeyDown}
      >
        <SkillContent Title={DialogTitle} Description={DialogDescription} Close={DialogClose} />
      </DialogContent>
    </Dialog>
  );
}
