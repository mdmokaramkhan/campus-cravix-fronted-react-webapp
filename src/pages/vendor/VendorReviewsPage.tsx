import { Star } from "lucide-react";

export default function VendorReviewsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Star className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Reviews</h2>
      <p className="mt-2 text-sm text-muted-foreground">Coming in Phase 2.7 — read customer reviews and ratings.</p>
    </div>
  );
}
