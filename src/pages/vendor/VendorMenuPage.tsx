import { UtensilsCrossed } from "lucide-react";

export default function VendorMenuPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <UtensilsCrossed className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Menu Management</h2>
      <p className="mt-2 text-sm text-muted-foreground">Coming in Phase 2.3 — add, edit, and manage your menu items.</p>
    </div>
  );
}
