import { ShoppingBag } from "lucide-react";

export default function VendorOrdersPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <ShoppingBag className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Orders</h2>
      <p className="mt-2 text-sm text-muted-foreground">Coming in Phase 2.5 — view and manage incoming orders.</p>
    </div>
  );
}
