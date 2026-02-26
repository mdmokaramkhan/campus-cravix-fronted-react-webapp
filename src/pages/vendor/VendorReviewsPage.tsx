import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Star, X, MessageSquare } from "lucide-react";
import {
  vendorService,
  type Review,
  type RatingSummary,
} from "@/services/vendorService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function avatarColor(id: string) {
  const sum = Array.from(id).reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// ── Star display ──────────────────────────────────────────────────────────────

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sz = size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            sz,
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/30"
          )}
        />
      ))}
    </span>
  );
}

// ── Rating summary card ────────────────────────────────────────────────────────

function RatingSummaryCard({ summary }: { summary: RatingSummary }) {
  const maxBreakdownCount = Math.max(...Object.values(summary.breakdown), 1);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
      {/* Big number */}
      <div className="flex flex-col items-center justify-center gap-1 sm:min-w-[120px]">
        <span className="text-5xl font-bold tabular-nums text-foreground">
          {summary.totalCount > 0 ? summary.averageRating.toFixed(1) : "—"}
        </span>
        <StarRow rating={Math.round(summary.averageRating)} size="md" />
        <span className="mt-1 text-xs text-muted-foreground">
          {summary.totalCount} review{summary.totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Divider */}
      <div className="hidden w-px self-stretch bg-border sm:block" />
      <div className="block h-px w-full bg-border sm:hidden" />

      {/* Breakdown bars */}
      <div className="flex flex-1 flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.breakdown[star] ?? 0;
          const pct = summary.totalCount > 0 ? (count / summary.totalCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2.5">
              <div className="flex w-14 shrink-0 items-center justify-end gap-1">
                <span className="text-xs font-medium text-muted-foreground">{star}</span>
                <Star className="size-3 fill-amber-400 text-amber-400" />
              </div>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Filter tabs ────────────────────────────────────────────────────────────────

const RATING_FILTERS: { value: number | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: 5, label: "5 ★" },
  { value: 4, label: "4 ★" },
  { value: 3, label: "3 ★" },
  { value: 2, label: "2 ★" },
  { value: 1, label: "1 ★" },
];

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const student = review.studentId;
  const order = review.orderId;
  const color = avatarColor(student._id);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Top row: avatar + name + date + stars */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              color
            )}
          >
            {initials(student.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {student.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <StarRow rating={review.rating} size="sm" />
        </div>
      </div>

      {/* Comment */}
      {review.comment ? (
        <p className="text-sm leading-relaxed text-foreground/90">{review.comment}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">No written comment.</p>
      )}

      {/* Images */}
      {review.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Review image ${i + 1}`}
              className="h-20 w-20 rounded-lg object-cover border border-border"
            />
          ))}
        </div>
      )}

      {/* Order reference */}
      {order && (
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <span className="shrink-0 font-medium">Order:</span>
          <span className="truncate">
            {order.items
              .slice(0, 2)
              .map((it) => `${it.quantity}× ${it.name}`)
              .join(", ")}
            {order.items.length > 2 && ` +${order.items.length - 2} more`}
          </span>
          <span className="ml-auto shrink-0">
            ₹{order.totalAmount.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        {filtered ? (
          <Star className="size-8 text-muted-foreground" />
        ) : (
          <MessageSquare className="size-8 text-muted-foreground" />
        )}
      </div>
      <h2 className="mt-4 text-base font-semibold text-foreground">
        {filtered ? "No reviews for this rating" : "No reviews yet"}
      </h2>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        {filtered
          ? "Try selecting a different star filter above."
          : "Customer reviews will appear here once students start placing orders."}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    averageRating: 0,
    totalCount: 0,
    breakdown: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<number | "all">("all");

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await vendorService.listReviews({ limit: 100, skip: 0 });
      setReviews(res.reviews ?? []);
      setRatingSummary(
        res.ratingSummary ?? { averageRating: 0, totalCount: 0, breakdown: {} }
      );
    } catch {
      if (!silent) setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredReviews =
    activeFilter === "all"
      ? reviews
      : reviews.filter((r) => r.rating === activeFilter);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
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
          <p className="font-medium text-foreground">Failed to load reviews</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reviews</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {reviews.length === 0
              ? "No reviews yet"
              : `${reviews.length} review${reviews.length !== 1 ? "s" : ""} from customers`}
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

      {/* ── Rating summary ──────────────────────────────────────────────────── */}
      <RatingSummaryCard summary={ratingSummary} />

      {/* ── Filter tabs ─────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {RATING_FILTERS.map((tab) => {
            const count =
              tab.value === "all"
                ? reviews.length
                : (ratingSummary.breakdown[tab.value] ?? 0);
            const isActive = activeFilter === tab.value;
            return (
              <button
                key={String(tab.value)}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
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
                      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
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
      )}

      {/* ── Review list ─────────────────────────────────────────────────────── */}
      {filteredReviews.length === 0 ? (
        <EmptyState filtered={activeFilter !== "all"} />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredReviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}

    </div>
  );
}
