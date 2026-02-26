import { Images } from "lucide-react";

export default function VendorBannersPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Images className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Banners</h2>
      <p className="mt-2 text-sm text-muted-foreground">Coming in Phase 2.4 — manage promotional banners for your stall.</p>
    </div>
  );
}
