import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChefHat,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  ShoppingBag,
  X,
} from "lucide-react";
import {
  vendorService,
  type Order,
  type OrderStatus,
} from "@/services/vendorService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_STATUSES: OrderStatus[] = ["Pending", "Preparing", "Ready", "Collected", "Cancelled"];

const STATUS_TABS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all",        label: "All"       },
  { value: "Pending",    label: "Pending"   },
  { value: "Preparing",  label: "Preparing" },
  { value: "Ready",      label: "Ready"     },
  { value: "Collected",  label: "Collected" },
  { value: "Cancelled",  label: "Cancelled" },
];

const STATUS_META: Record<
  OrderStatus,
  { label: string; dot: string; badge: string; text: string }
> = {
  Pending: {
    label: "Pending",
    dot:   "bg-amber-400",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    text:  "text-amber-700 dark:text-amber-400",
  },
  Preparing: {
    label: "Preparing",
    dot:   "bg-blue-400",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    text:  "text-blue-700 dark:text-blue-400",
  },
  Ready: {
    label: "Ready",
    dot:   "bg-green-400",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    text:  "text-green-700 dark:text-green-400",
  },
  Collected: {
    label: "Collected",
    dot:   "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground",
    text:  "text-muted-foreground",
  },
  Cancelled: {
    label: "Cancelled",
    dot:   "bg-destructive/60",
    badge: "bg-destructive/10 text-destructive",
    text:  "text-destructive",
  },
};

// Next valid status transitions from vendor's perspective
const NEXT_ACTIONS: Record<
  OrderStatus,
  { status: OrderStatus; label: string; icon: React.ElementType; variant: "default" | "outline" | "destructive" }[]
> = {
  Pending: [
    { status: "Preparing", label: "Start Preparing", icon: ChefHat,   variant: "default"     },
    { status: "Cancelled", label: "Cancel order",    icon: X,          variant: "destructive" },
  ],
  Preparing: [
    { status: "Ready",     label: "Mark as Ready",   icon: Check,      variant: "default"     },
    { status: "Cancelled", label: "Cancel order",    icon: X,          variant: "destructive" },
  ],
  Ready: [
    { status: "Collected", label: "Mark Collected",  icon: ShoppingBag, variant: "default"    },
  ],
  Collected: [],
  Cancelled: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

function itemCount(order: Order) {
  return order.items.reduce((s, i) => s + i.quantity, 0);
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", m.badge)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  onSelect: (order: Order) => void;
  onQuickAction: (order: Order, status: OrderStatus) => void;
  updatingId: string | null;
}

function OrderCard({ order, onSelect, onQuickAction, updatingId }: OrderCardProps) {
  const actions = NEXT_ACTIONS[order.status];
  const primaryAction = actions[0];
  const isUpdating = updatingId === order._id;

  return (
    <div
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-border/70 hover:shadow"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded-lg bg-muted px-2 py-1 font-mono text-xs font-semibold text-muted-foreground">
            #{shortId(order._id)}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-foreground">{formatCurrency(order.totalAmount)}</p>
          <p className="text-[11px] text-muted-foreground">{formatDate(order.createdAt)} · {formatTime(order.createdAt)}</p>
        </div>
      </div>

      {/* Student + items summary */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{order.student.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {order.items.slice(0, 2).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
            {order.items.length > 2 && ` +${order.items.length - 2} more`}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {/* Quick primary action */}
          {primaryAction && (
            <Button
              size="sm"
              variant={primaryAction.variant}
              onClick={(e) => { e.stopPropagation(); onQuickAction(order, primaryAction.status); }}
              disabled={isUpdating}
              className="h-7 gap-1 px-2.5 text-xs"
            >
              {isUpdating ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <primaryAction.icon className="size-3" />
              )}
              <span className="hidden sm:inline">{primaryAction.label}</span>
            </Button>
          )}
          {/* Details chevron */}
          <button
            type="button"
            onClick={() => onSelect(order)}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="View order details"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Pickup slot */}
      {order.pickupSlot && (
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Clock className="size-3 shrink-0" />
          Pickup: {order.pickupSlot}
        </div>
      )}
    </div>
  );
}

// ── Order detail sheet ────────────────────────────────────────────────────────

interface OrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (order: Order, status: OrderStatus) => void;
  updatingId: string | null;
}

function OrderDetailSheet({ order, open, onClose, onUpdateStatus, updatingId }: OrderDetailSheetProps) {
  if (!order) return null;

  const actions = NEXT_ACTIONS[order.status];
  const isUpdating = updatingId === order._id;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            Order <span className="font-mono text-muted-foreground">#{shortId(order._id)}</span>
          </SheetTitle>
          <SheetDescription>
            Placed {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">

          {/* Status */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
            <p className="text-sm font-medium text-foreground">Status</p>
            <StatusBadge status={order.status} />
          </div>

          {/* Student info */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
            <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">{order.student.name}</p>
              <p className="text-sm text-muted-foreground">{order.student.phone}</p>
            </div>
          </div>

          {/* Pickup slot */}
          {order.pickupSlot && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pickup Slot</p>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">{order.pickupSlot}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Items ({itemCount(order)})
            </p>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-muted-foreground">{item.quantity}×</span>
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    {item.options && item.options.length > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.options.map((o) => `${o.name}: ${o.choice}`).join(" · ")}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-medium text-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Price summary */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
            <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(order.items.reduce((s, i) => s + i.price * i.quantity, 0))}</span>
              </div>
              {order.coupon && (
                <div className="flex justify-between text-sm text-green-700 dark:text-green-400">
                  <span>Coupon ({order.coupon.code})</span>
                  <span>−{formatCurrency(order.coupon.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm font-bold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              {order.paymentMethod && (
                <p className="text-xs text-muted-foreground pt-0.5">
                  Payment: {order.paymentMethod}
                  {order.paymentStatus ? ` · ${order.paymentStatus}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Status actions */}
          {actions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
              <div className="flex flex-col gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.status}
                    variant={action.variant}
                    onClick={() => onUpdateStatus(order, action.status)}
                    disabled={isUpdating}
                    className="w-full gap-2"
                  >
                    {isUpdating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <action.icon className="size-4" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ activeTab }: { activeTab: string }) {
  const messages: Record<string, { title: string; desc: string }> = {
    all:       { title: "No orders yet",           desc: "Orders will appear here once students start placing them."          },
    Pending:   { title: "No pending orders",        desc: "All caught up! New orders will appear here."                        },
    Preparing: { title: "Nothing being prepared",   desc: "Accept a pending order to start preparing."                         },
    Ready:     { title: "No orders ready",          desc: "Mark a preparing order as ready when it's done."                    },
    Collected: { title: "No collected orders",      desc: "Orders marked collected will appear here."                          },
    Cancelled: { title: "No cancelled orders",      desc: "Cancelled orders will appear here."                                 },
  };

  const m = messages[activeTab] ?? messages.all;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <ShoppingBag className="size-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-foreground">{m.title}</h2>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{m.desc}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    else { setRefreshing(true); }
    try {
      const res = await vendorService.listOrders();
      setOrders(res.orders ?? []);
    } catch {
      if (!silent) setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    pollingRef.current = setInterval(() => load(true), 30_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [load]);

  // ── Status update ──────────────────────────────────────────────────────────

  const handleUpdateStatus = async (order: Order, status: OrderStatus) => {
    setUpdatingId(order._id);
    setUpdateError(null);
    try {
      const updated = await vendorService.updateOrderStatus(order._id, status);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      if (selectedOrder?._id === updated._id) {
        setSelectedOrder(updated);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setUpdateError(msg ?? "Failed to update order status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Sheet ──────────────────────────────────────────────────────────────────

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setSheetOpen(true);
  };

  const closeDetails = () => {
    setSheetOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const counts = ALL_STATUSES.reduce<Record<string, number>>(
    (acc, s) => { acc[s] = orders.filter((o) => o.status === s).length; return acc; },
    {}
  );

  const filteredOrders =
    activeTab === "all"
      ? [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : orders
          .filter((o) => o.status === activeTab)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading orders…</p>
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
          <p className="font-medium text-foreground">Failed to load orders</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Orders</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {orders.length === 0
              ? "No orders yet"
              : `${orders.length} order${orders.length > 1 ? "s" : ""} · ${counts["Pending"] ?? 0} pending`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* ── Update error banner ──────────────────────────────────────────────── */}
      {updateError && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
          <span>{updateError}</span>
          <button
            type="button"
            onClick={() => setUpdateError(null)}
            className="ml-3 rounded p-0.5 hover:bg-destructive/10"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ── Status filter tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === "all" ? orders.length : (counts[tab.value] ?? 0);
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
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
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Stats row (active statuses) ──────────────────────────────────────── */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {(["Pending", "Preparing", "Ready", "Collected", "Cancelled"] as OrderStatus[]).map((s) => {
            const m = STATUS_META[s];
            const n = counts[s] ?? 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setActiveTab(s)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border bg-card p-3 text-center transition-all",
                  activeTab === s ? "border-primary/40 shadow-sm ring-1 ring-primary/20" : "border-border hover:border-border/70"
                )}
              >
                <span className={cn("text-xl font-bold", m.text)}>{n}</span>
                <span className="text-[11px] font-medium text-muted-foreground">{m.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Order list ──────────────────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onSelect={openDetails}
              onQuickAction={handleUpdateStatus}
              updatingId={updatingId}
            />
          ))}
        </div>
      )}

      {/* ── Order detail sheet ───────────────────────────────────────────────── */}
      <OrderDetailSheet
        order={selectedOrder}
        open={sheetOpen}
        onClose={closeDetails}
        onUpdateStatus={handleUpdateStatus}
        updatingId={updatingId}
      />

    </div>
  );
}
