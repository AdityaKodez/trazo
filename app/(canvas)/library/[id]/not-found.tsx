import { NotFoundView } from "@/components/trazo/not-found-view";

export default function StickerNotFound() {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <NotFoundView />
    </div>
  );
}
