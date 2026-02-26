import { Tag } from "lucide-react";

export default function VendorCouponsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Tag className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Coupons</h2>
      <p className="mt-2 text-sm text-muted-foreground">Coming in Phase 2.6 — create and manage discount coupons.</p>
    </div>
  );
}
