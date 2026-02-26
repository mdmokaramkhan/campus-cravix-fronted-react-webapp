import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  ExternalLink,
  Images,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { vendorService, type Banner } from "@/services/vendorService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  link: string;
  isActive: boolean;
  imageFile: File | null;
  imagePreview: string | null;
}

const EMPTY_FORM: FormState = {
  title: "",
  link: "",
  isActive: true,
  imageFile: null,
  imagePreview: null,
};

function bannerToFormState(banner: Banner): FormState {
  return {
    title: banner.title ?? "",
    link: banner.link ?? "",
    isActive: banner.isActive,
    imageFile: null,
    imagePreview: banner.image,
  };
}

// ── Banner card ────────────────────────────────────────────────────────────────

interface BannerCardProps {
  banner: Banner;
  index: number;
  total: number;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
  onToggleActive: (banner: Banner) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  togglingId: string | null;
  reordering: boolean;
}

function BannerCard({
  banner,
  index,
  total,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  togglingId,
  reordering,
}: BannerCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md",
        !banner.isActive && "opacity-70"
      )}
    >
      {/* Image preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={banner.image}
          alt={banner.title ?? `Banner ${index + 1}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* Inactive dim */}
        {!banner.isActive && <div className="absolute inset-0 bg-black/30" />}

        {/* Order + status badges */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
            {index + 1}
          </span>
          {!banner.isActive && (
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
              Inactive
            </span>
          )}
        </div>

        {/* Reorder arrows — top right corner */}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0 || reordering}
            className="flex size-7 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30"
            title="Move left / up"
          >
            <ArrowUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1 || reordering}
            className="flex size-7 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30"
            title="Move right / down"
          >
            <ArrowDown className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {banner.title ?? <span className="text-muted-foreground italic">Untitled</span>}
          </p>
          {banner.link ? (
            <a
              href={banner.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 truncate text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">{banner.link}</span>
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">No link</p>
          )}
        </div>

        {/* Active toggle */}
        <button
          type="button"
          onClick={() => onToggleActive(banner)}
          disabled={togglingId === banner._id}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
            banner.isActive
              ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
          title={banner.isActive ? "Deactivate" : "Activate"}
        >
          {togglingId === banner._id ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <span className={cn("size-1.5 rounded-full", banner.isActive ? "bg-green-500" : "bg-muted-foreground")} />
          )}
          {banner.isActive ? "Active" : "Off"}
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(banner)}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Edit"
        >
          <Pencil className="size-3.5" />
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => { onDelete(banner._id); setConfirmDelete(false); }}
              className="flex items-center gap-1 rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              <Check className="size-3" /> Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VendorBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBanners(await vendorService.listBanners());
    } catch {
      setError("Failed to load banners. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Sheet open/close ──────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingBanner(null);
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setSubmitSuccess(false);
    setSheetOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm(bannerToFormState(banner));
    setSubmitError(null);
    setSubmitSuccess(false);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setTimeout(() => {
      setEditingBanner(null);
      setForm(EMPTY_FORM);
      setSubmitError(null);
      setSubmitSuccess(false);
    }, 300);
  };

  // ── Image selection ───────────────────────────────────────────────────────

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({
      ...f,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const clearImage = () => {
    setForm((f) => ({ ...f, imageFile: null, imagePreview: null }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBanner && !form.imageFile) {
      setSubmitError("An image is required for the banner.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("link", form.link.trim());
      fd.append("isActive", String(form.isActive));
      if (form.imageFile) {
        fd.append("image", form.imageFile);
      }

      if (editingBanner) {
        const updated = await vendorService.updateBanner(editingBanner._id, fd);
        setBanners((prev) =>
          prev.map((b) => (b._id === updated._id ? updated : b))
        );
      } else {
        const created = await vendorService.createBanner(fd);
        setBanners((prev) => [...prev, created]);
      }

      setSubmitSuccess(true);
      setTimeout(closeSheet, 900);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setSubmitError(msg ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await vendorService.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch {
      // silently keep the banner in list on failure
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────

  const handleToggleActive = async (banner: Banner) => {
    setTogglingId(banner._id);
    try {
      const fd = new FormData();
      fd.append("isActive", String(!banner.isActive));
      const updated = await vendorService.updateBanner(banner._id, fd);
      setBanners((prev) =>
        prev.map((b) => (b._id === updated._id ? updated : b))
      );
    } catch {
      // silently ignore
    } finally {
      setTogglingId(null);
    }
  };

  // ── Reorder ───────────────────────────────────────────────────────────────

  const moveItem = async (fromIndex: number, toIndex: number) => {
    const reordered = [...banners];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setBanners(reordered);
    setReordering(true);

    try {
      const updated = await vendorService.reorderBanners(
        reordered.map((b) => b._id)
      );
      setBanners(updated);
    } catch {
      setBanners(banners);
    } finally {
      setReordering(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading banners…</p>
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
          <p className="font-medium text-foreground">Failed to load</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Banners</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {banners.length === 0
              ? "No banners yet — add a promotional banner"
              : `${banners.length} banner${banners.length > 1 ? "s" : ""} · ${activeCount} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reordering && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Saving order…
            </span>
          )}
          <Button onClick={openAdd} size="sm">
            <Plus className="size-4" /> Add banner
          </Button>
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {banners.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <Images className="size-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            No banners yet
          </h2>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Add promotional banners that students will see when browsing your
            stall.
          </p>
          <Button onClick={openAdd} className="mt-6" size="sm">
            <Plus className="size-4" /> Add your first banner
          </Button>
        </div>
      )}

      {/* ── Banner list ──────────────────────────────────────────────────────── */}
      {banners.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {banners.map((banner, index) => (
              <BannerCard
                key={banner._id}
                banner={banner}
                index={index}
                total={banners.length}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onMoveUp={(i) => moveItem(i, i - 1)}
                onMoveDown={(i) => moveItem(i, i + 1)}
                togglingId={togglingId}
                reordering={reordering}
              />
            ))}
          </div>
          {deletingId && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Deleting…
            </div>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Hover a card and use the arrows to reorder — saved automatically.
          </p>
        </div>
      )}

      {/* ── Add / Edit Sheet ─────────────────────────────────────────────────── */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        <SheetContent
          side="right"
          className="flex flex-col sm:max-w-md overflow-y-auto"
        >
          <SheetHeader className="border-b pb-4">
            <SheetTitle>
              {editingBanner ? "Edit banner" : "Add banner"}
            </SheetTitle>
            <SheetDescription>
              {editingBanner
                ? "Update the banner details and hit save."
                : "Upload an image and optionally add a title or link."}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4"
          >

            {/* ── Image upload ──────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label>
                Banner image{" "}
                {!editingBanner && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <div
                className="group relative flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50"
                onClick={() => imageInputRef.current?.click()}
              >
                {form.imagePreview ? (
                  <>
                    <img
                      src={form.imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="size-5 text-white" />
                      <span className="mt-1 text-xs font-medium text-white">
                        Change image
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                      className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Camera className="size-7" />
                    <span className="text-xs font-medium">
                      Click to upload image
                    </span>
                    <span className="text-[11px]">
                      JPG, PNG or WebP · recommended 16:5 ratio
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* ── Title ────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="banner-title">Title</Label>
              <Input
                id="banner-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Weekend Special Offer"
              />
            </div>

            {/* ── Link ─────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="banner-link">Link URL</Label>
              <Input
                id="banner-link"
                type="url"
                value={form.link}
                onChange={(e) =>
                  setForm((f) => ({ ...f, link: e.target.value }))
                }
                placeholder="https://…"
              />
              <p className="text-xs text-muted-foreground">
                Optional — students can tap the banner to visit this URL.
              </p>
            </div>

            {/* ── Active toggle ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">
                  Show this banner to students
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isActive: checked }))
                }
              />
            </div>

            {/* ── Feedback ─────────────────────────────────────────────────── */}
            {submitError && (
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                <span>{submitError}</span>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="ml-3 rounded p-0.5 hover:bg-destructive/10"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {submitSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <Check className="size-4 shrink-0" />
                {editingBanner ? "Banner updated!" : "Banner added!"}
              </div>
            )}
          </form>

          <SheetFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeSheet}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />{" "}
                  {editingBanner ? "Saving…" : "Adding…"}
                </>
              ) : editingBanner ? (
                "Save changes"
              ) : (
                "Add banner"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
