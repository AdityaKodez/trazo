import { BottomDock } from "@/components/trazo/bottom-dock";
import { TrazoCanvas } from "@/components/trazo/trazo-canvas";
import { TrazoProvider } from "@/components/trazo/trazo-experience";
import { TrazoOverlay } from "@/components/trazo/trazo-overlay";

export default function TrazoHomePage() {
  return (
    <TrazoProvider>
      <main className="relative h-dvh w-screen overflow-hidden">
        <TrazoCanvas />
        <BottomDock />
        <TrazoOverlay />
      </main>
    </TrazoProvider>
  );
}
