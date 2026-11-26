import { NotFoundLazy } from "@/components/trazo/not-found-lazy";

export default function StickerNotFound() {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <NotFoundLazy />
    </div>
  );
}
