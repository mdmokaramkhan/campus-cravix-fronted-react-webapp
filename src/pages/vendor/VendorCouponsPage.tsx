import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Pencil,
  Percent,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  vendorService,
  type Coupon,
  type CouponDiscountType,
  type CreateCouponParams,
  type UpdateCouponParams,
} from "@/services/vendorService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function isExpired(expiryDate: string) {
  return new Date(expiryDate) <= new Date();
}

type CouponFilter = "all" | "active" | "inactive" | "expired";

// ── Coupon status helpers ─────────────────────────────────────────────────────

function getCouponStatus(coupon: Coupon): "active" | "inactive" | "expired" {
  if (isExpired(coupon.expiryDate)) return "expired";
  if (!coupon.isActive) return "inactive";
  return "active";
}

const STATUS_META = {
  active: {
    label: "Active",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    dot: "bg-green-400",
  },
  inactive: {
    label: "Inactive",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  expired: {
    label: "Expired",
    badge: "bg-destructive/10 text-destructive",
    dot: "bg-destructive/60",
  },
} as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function CouponStatusBadge({ coupon }: { coupon: Coupon }) {
  const status = getCouponStatus(coupon);
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        m.badge
      )}
    >
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

// ── Coupon form ───────────────────────────────────────────────────────────────

interface CouponFormValues {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minOrderAmount: string;
  expiryDate: string;
}

const EMPTY_FORM: CouponFormValues = {
  code: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderAmount: "",
  expiryDate: "",
};

function couponToForm(c: Coupon): CouponFormValues {
  return {
    code: c.code,
    discountType: c.discountType,
    discountValue: String(c.discountValue),
    minOrderAmount: c.minOrderAmount > 0 ? String(c.minOrderAmount) : "",
    expiryDate: toDateInputValue(c.expiryDate),
  };
}

interface CouponFormSheetProps {
  open: boolean;
  onClose: () => void;
  editing: Coupon | null;
  onSave: (values: CouponFormValues) => Promise<void>;
  saving: boolean;
  error: string | null;
}

function CouponFormSheet({
  open,
  onClose,
  editing,
  onSave,
  saving,
  error,
}: CouponFormSheetProps) {
  const [form, setForm] = useState<CouponFormValues>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(editing ? couponToForm(editing) : EMPTY_FORM);
    }
  }, [open, editing]);

  const set = (field: keyof CouponFormValues) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setDiscountType = (type: CouponDiscountType) =>
    setForm((prev) => ({ ...prev, discountType: type }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{editing ? "Edit Coupon" : "New Coupon"}</SheetTitle>
          <SheetDescription>
            {editing
              ? "Update the coupon details below."
              : "Fill in the details to create a new discount coupon."}
          </SheetDescription>
        </SheetHeader>

        <form
          id="coupon-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5"
        >
          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="coupon-code">Coupon Code</Label>
            <Input
              id="coupon-code"
              placeholder="e.g. SAVE20"
              value={form.code}
              onChange={set("code")}
              className="uppercase placeholder:normal-case"
              maxLength={20}
              required
              autoComplete="off"
              style={{ textTransform: "uppercase" }}
            />
            <p className="text-xs text-muted-foreground">
              Letters and numbers only. Will be saved in uppercase.
            </p>
          </div>

          {/* Discount type */}
          <div className="space-y-1.5">
            <Label>Discount Type</Label>
            <div className="flex gap-2">
              {(["PERCENT", "FLAT"] as CouponDiscountType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDiscountType(type)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    form.discountType === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-border/70 hover:text-foreground"
                  )}
                >
                  {type === "PERCENT" ? (
                    <Percent className="size-3.5" />
                  ) : (
                    <span className="text-xs font-bold">₹</span>
                  )}
                  {type === "PERCENT" ? "Percentage" : "Flat Amount"}
                </button>
              ))}
            </div>
          </div>

          {/* Discount value */}
          <div className="space-y-1.5">
            <Label htmlFor="discount-value">
              Discount Value{" "}
              <span className="text-muted-foreground">
                ({form.discountType === "PERCENT" ? "%" : "₹"})
              </span>
            </Label>
            <div className="relative">
              <Input
                id="discount-value"
                type="number"
                placeholder={form.discountType === "PERCENT" ? "e.g. 20" : "e.g. 50"}
                value={form.discountValue}
                onChange={set("discountValue")}
                min={form.discountType === "FLAT" ? "1" : "0"}
                max={form.discountType === "PERCENT" ? "100" : undefined}
                step="any"
                required
                className="pr-10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                {form.discountType === "PERCENT" ? "%" : "₹"}
              </span>
            </div>
            {form.discountType === "PERCENT" && (
              <p className="text-xs text-muted-foreground">Maximum 100%.</p>
            )}
          </div>

          {/* Min order amount */}
          <div className="space-y-1.5">
            <Label htmlFor="min-order">
              Minimum Order Amount{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <Input
                id="min-order"
                type="number"
                placeholder="e.g. 200"
                value={form.minOrderAmount}
                onChange={set("minOrderAmount")}
                min="0"
                step="any"
                className="pr-10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                ₹
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank or 0 for no minimum.
            </p>
          </div>

          {/* Expiry date */}
          <div className="space-y-1.5">
            <Label htmlFor="expiry-date">Expiry Date</Label>
            <Input
              id="expiry-date"
              type="date"
              value={form.expiryDate}
              onChange={set("expiryDate")}
              min={today}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
              <X className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        <div className="border-t px-4 py-4">
          <Button
            type="submit"
            form="coupon-form"
            className="w-full gap-2"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {editing ? "Save Changes" : "Create Coupon"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Delete confirm sheet ──────────────────────────────────────────────────────

interface DeleteConfirmSheetProps {
  open: boolean;
  coupon: Coupon | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}

function DeleteConfirmSheet({
  open,
  coupon,
  onClose,
  onConfirm,
  deleting,
}: DeleteConfirmSheetProps) {
  if (!coupon) return null;
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="sm:max-w-lg sm:mx-auto rounded-t-2xl">
        <SheetHeader className="pb-4 text-left">
          <SheetTitle>Delete Coupon</SheetTitle>
          <SheetDescription>
            Are you sure you want to permanently delete the coupon{" "}
            <span className="font-mono font-bold text-foreground">{coupon.code}</span>?
            This action cannot be undone.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 pb-4">
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete Coupon
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Coupon card ───────────────────────────────────────────────────────────────

interface CouponCardProps {
  coupon: Coupon;
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
  onToggleActive: (coupon: Coupon) => void;
  togglingId: string | null;
}

function CouponCard({
  coupon,
  onEdit,
  onDelete,
  onToggleActive,
  togglingId,
}: CouponCardProps) {
  const expired = isExpired(coupon.expiryDate);
  const isToggling = togglingId === coupon._id;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/70 hover:shadow">

      {/* Top row: code + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-bold text-foreground tracking-wider">
            {coupon.code}
          </span>
          <CouponStatusBadge coupon={coupon} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(coupon)}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Edit coupon"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(coupon)}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Delete coupon"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Discount info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
            {coupon.discountType === "PERCENT" ? (
              <Percent className="size-3.5 text-primary" />
            ) : (
              <span className="text-xs font-bold text-primary">₹</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {coupon.discountType === "PERCENT"
                ? `${coupon.discountValue}% off`
                : formatCurrency(coupon.discountValue) + " off"}
            </p>
            {coupon.minOrderAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Min. order {formatCurrency(coupon.minOrderAmount)}
              </p>
            )}
          </div>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Expiry */}
        <div className="flex items-center gap-1.5 min-w-0">
          <CalendarDays
            className={cn(
              "size-3.5 shrink-0",
              expired ? "text-destructive" : "text-muted-foreground"
            )}
          />
          <div>
            <p
              className={cn(
                "text-xs font-medium",
                expired ? "text-destructive" : "text-foreground"
              )}
            >
              {expired ? "Expired" : "Expires"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(coupon.expiryDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle active — hide if expired */}
      {!expired && (
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {coupon.isActive ? "Coupon is active" : "Coupon is inactive"}
          </span>
          {isToggling ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={coupon.isActive}
              onCheckedChange={() => onToggleActive(coupon)}
              size="sm"
              aria-label={coupon.isActive ? "Deactivate coupon" : "Activate coupon"}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  filter,
  onCreate,
}: {
  filter: CouponFilter;
  onCreate: () => void;
}) {
  const messages: Record<CouponFilter, { title: string; desc: string }> = {
    all: {
      title: "No coupons yet",
      desc: "Create your first discount coupon to attract more students.",
    },
    active: {
      title: "No active coupons",
      desc: "Active coupons will appear here. Create one or reactivate an existing coupon.",
    },
    inactive: {
      title: "No inactive coupons",
      desc: "Coupons you deactivate will appear here.",
    },
    expired: {
      title: "No expired coupons",
      desc: "Coupons past their expiry date will appear here.",
    },
  };

  const m = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Tag className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-foreground">{m.title}</h2>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{m.desc}</p>
      {filter === "all" && (
        <Button onClick={onCreate} size="sm" className="mt-4 gap-1.5">
          <Plus className="size-4" />
          Create Coupon
        </Button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const FILTER_TABS: { value: CouponFilter; label: string }[] = [
  { value: "all",      label: "All"      },
  { value: "active",   label: "Active"   },
  { value: "inactive", label: "Inactive" },
  { value: "expired",  label: "Expired"  },
];

export default function VendorCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<CouponFilter>("all");

  // Form sheet
  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete sheet
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggle active
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vendorService.listCoupons();
      setCoupons(data);
    } catch {
      setError("Failed to load coupons. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create / Edit ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingCoupon(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async (values: {
    code: string;
    discountType: CouponDiscountType;
    discountValue: string;
    minOrderAmount: string;
    expiryDate: string;
  }) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editingCoupon) {
        const params: UpdateCouponParams = {
          code: values.code,
          discountType: values.discountType,
          discountValue: parseFloat(values.discountValue),
          minOrderAmount: values.minOrderAmount ? parseFloat(values.minOrderAmount) : 0,
          expiryDate: values.expiryDate,
        };
        const updated = await vendorService.updateCoupon(editingCoupon._id, params);
        setCoupons((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
      } else {
        const params: CreateCouponParams = {
          code: values.code,
          discountType: values.discountType,
          discountValue: parseFloat(values.discountValue),
          minOrderAmount: values.minOrderAmount ? parseFloat(values.minOrderAmount) : 0,
          expiryDate: values.expiryDate,
        };
        const created = await vendorService.createCoupon(params);
        setCoupons((prev) => [created, ...prev]);
      }
      setFormOpen(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setFormError(msg ?? "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────────

  const handleToggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon._id);
    try {
      let updated: Coupon;
      if (coupon.isActive) {
        updated = await vendorService.deactivateCoupon(coupon._id);
      } else {
        updated = await vendorService.updateCoupon(coupon._id, { isActive: true });
      }
      setCoupons((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    } catch {
      // silently fail — leave state unchanged
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const openDelete = (coupon: Coupon) => {
    setDeletingCoupon(coupon);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCoupon) return;
    setDeleting(true);
    try {
      await vendorService.deleteCoupon(deletingCoupon._id);
      setCoupons((prev) => prev.filter((c) => c._id !== deletingCoupon._id));
      setDeleteOpen(false);
    } catch {
      // keep open so user can retry
    } finally {
      setDeleting(false);
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────────

  const counts = {
    all:      coupons.length,
    active:   coupons.filter((c) => getCouponStatus(c) === "active").length,
    inactive: coupons.filter((c) => getCouponStatus(c) === "inactive").length,
    expired:  coupons.filter((c) => getCouponStatus(c) === "expired").length,
  };

  const filtered =
    filter === "all"
      ? coupons
      : coupons.filter((c) => getCouponStatus(c) === filter);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading coupons…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
          <X className="size-6 text-destructive" />
        </div>
        <div>
          <p className="font-medium text-foreground">Failed to load coupons</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Coupons</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {coupons.length === 0
              ? "No coupons yet"
              : `${coupons.length} coupon${coupons.length > 1 ? "s" : ""} · ${counts.active} active`}
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          New Coupon
        </Button>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────────── */}
      {coupons.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {(["active", "inactive", "expired"] as const).map((s) => {
            const m = STATUS_META[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border bg-card p-3 text-center transition-all",
                  filter === s
                    ? "border-primary/40 shadow-sm ring-1 ring-primary/20"
                    : "border-border hover:border-border/70"
                )}
              >
                <span className="text-xl font-bold text-foreground">{counts[s]}</span>
                <span className="text-[11px] font-medium text-muted-foreground capitalize">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Filter tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const count = counts[tab.value];
          const isActive = filter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full text-[10px] font-bold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background text-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Coupon list ───────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} onCreate={openCreate} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((coupon) => (
            <CouponCard
              key={coupon._id}
              coupon={coupon}
              onEdit={openEdit}
              onDelete={openDelete}
              onToggleActive={handleToggleActive}
              togglingId={togglingId}
            />
          ))}
        </div>
      )}

      {/* ── Form sheet ────────────────────────────────────────────────────────── */}
      <CouponFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editingCoupon}
        onSave={handleSave}
        saving={saving}
        error={formError}
      />

      {/* ── Delete confirm sheet ──────────────────────────────────────────────── */}
      <DeleteConfirmSheet
        open={deleteOpen}
        coupon={deletingCoupon}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

    </div>
  );
}
