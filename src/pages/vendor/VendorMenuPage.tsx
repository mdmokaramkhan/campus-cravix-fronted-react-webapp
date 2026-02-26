import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { vendorService, type MenuItem, type MenuItemOption } from "@/services/vendorService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  price: string;
  category: string;
  available: boolean;
  imageFile: File | null;
  imagePreview: string | null;
  options: MenuItemOption[];
}

const EMPTY_FORM: FormState = {
  name: "",
  price: "",
  category: "",
  available: true,
  imageFile: null,
  imagePreview: null,
  options: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupByCategory(items: MenuItem[]): Map<string, MenuItem[]> {
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}

function formatPrice(price: number) {
  return `₹${price.toFixed(2)}`;
}

function itemToFormState(item: MenuItem): FormState {
  return {
    name: item.name,
    price: String(item.price),
    category: item.category,
    available: item.available,
    imageFile: null,
    imagePreview: item.image ?? null,
    options: item.options.map((o) => ({
      name: o.name,
      choices: o.choices.map((c) => ({ label: c.label, priceModifier: c.priceModifier })),
    })),
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface OptionsEditorProps {
  options: MenuItemOption[];
  onChange: (options: MenuItemOption[]) => void;
}

function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const [expanded, setExpanded] = useState(false);

  const addOption = () =>
    onChange([...options, { name: "", choices: [{ label: "", priceModifier: 0 }] }]);

  const removeOption = (oi: number) =>
    onChange(options.filter((_, i) => i !== oi));

  const updateOptionName = (oi: number, name: string) =>
    onChange(options.map((o, i) => (i === oi ? { ...o, name } : o)));

  const addChoice = (oi: number) =>
    onChange(
      options.map((o, i) =>
        i === oi ? { ...o, choices: [...o.choices, { label: "", priceModifier: 0 }] } : o
      )
    );

  const removeChoice = (oi: number, ci: number) =>
    onChange(
      options.map((o, i) =>
        i === oi ? { ...o, choices: o.choices.filter((_, j) => j !== ci) } : o
      )
    );

  const updateChoice = (
    oi: number,
    ci: number,
    field: "label" | "priceModifier",
    value: string
  ) =>
    onChange(
      options.map((o, i) =>
        i === oi
          ? {
              ...o,
              choices: o.choices.map((c, j) =>
                j === ci
                  ? {
                      ...c,
                      [field]:
                        field === "priceModifier" ? (value === "" ? 0 : Number(value)) : value,
                    }
                  : c
              ),
            }
          : o
      )
    );

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40"
      >
        <span>
          Options / Variants{" "}
          {options.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {options.length}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          <p className="text-xs text-muted-foreground">
            Add option groups like Size or Toppings. Each group has choices with optional price add-ons.
          </p>

          {options.map((opt, oi) => (
            <div key={oi} className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={opt.name}
                  onChange={(e) => updateOptionName(oi, e.target.value)}
                  placeholder="Group name, e.g. Size"
                  className="text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeOption(oi)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-2">
                {opt.choices.map((choice, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <Input
                      value={choice.label}
                      onChange={(e) => updateChoice(oi, ci, "label", e.target.value)}
                      placeholder="Label, e.g. Large"
                      className="text-sm"
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={choice.priceModifier === 0 ? "" : choice.priceModifier}
                        onChange={(e) => updateChoice(oi, ci, "priceModifier", e.target.value)}
                        placeholder="0"
                        className="pl-6 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeChoice(oi, ci)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addChoice(oi)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Plus className="size-3" /> Add choice
                </button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addOption} className="w-full">
            <Plus className="size-3.5" /> Add option group
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Item card ──────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailable: (item: MenuItem) => void;
  togglingId: string | null;
}

function ItemCard({ item, onEdit, onDelete, onToggleAvailable, togglingId }: ItemCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 shadow-sm transition-all hover:border-border/80 hover:shadow">
      {/* Thumbnail */}
      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UtensilsCrossed className="size-5 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
          {!item.available && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Unavailable
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{formatPrice(item.price)}</span>
          {item.options.length > 0 && (
            <span className="text-xs text-muted-foreground">+{item.options.length} option{item.options.length > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Availability toggle */}
        <button
          type="button"
          onClick={() => onToggleAvailable(item)}
          disabled={togglingId === item._id}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
            item.available
              ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
          title={item.available ? "Mark unavailable" : "Mark available"}
        >
          {togglingId === item._id ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <span className={cn("size-1.5 rounded-full", item.available ? "bg-green-500" : "bg-muted-foreground")} />
          )}
          <span className="hidden sm:inline">{item.available ? "Available" : "Off"}</span>
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Edit item"
        >
          <Pencil className="size-3.5" />
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { onDelete(item._id); setConfirmDelete(false); }}
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
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Delete item"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VendorMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setItems(await vendorService.listMenu());
    } catch {
      setError("Failed to load menu. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Sheet open/close ──────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setSubmitSuccess(false);
    setSheetOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm(itemToFormState(item));
    setSubmitError(null);
    setSubmitSuccess(false);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setTimeout(() => {
      setEditingItem(null);
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
    if (!form.name.trim()) { setSubmitError("Name is required."); return; }
    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum < 0) { setSubmitError("Enter a valid price."); return; }
    if (!form.category.trim()) { setSubmitError("Category is required."); return; }

    setSubmitting(true); setSubmitError(null); setSubmitSuccess(false);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("price", String(priceNum));
      fd.append("category", form.category.trim());
      fd.append("available", String(form.available));
      if (form.options.length > 0) {
        fd.append("options", JSON.stringify(form.options));
      }
      if (form.imageFile) {
        fd.append("image", form.imageFile);
      }

      if (editingItem) {
        const updated = await vendorService.updateMenuItem(editingItem._id, fd);
        setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
      } else {
        const created = await vendorService.createMenuItem(fd);
        setItems((prev) => [...prev, created]);
      }
      setSubmitSuccess(true);
      setTimeout(closeSheet, 900);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
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
      await vendorService.deleteMenuItem(id);
      setItems((prev) => prev.filter((it) => it._id !== id));
    } catch {
      // silently surface — item stays in list
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle availability ───────────────────────────────────────────────────

  const handleToggleAvailable = async (item: MenuItem) => {
    setTogglingId(item._id);
    try {
      const fd = new FormData();
      fd.append("available", String(!item.available));
      const updated = await vendorService.updateMenuItem(item._id, fd);
      setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
    } catch {
      // silently ignore
    } finally {
      setTogglingId(null);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const grouped = groupByCategory(items);
  const categories = Array.from(grouped.keys()).sort();
  const availableCount = items.filter((i) => i.available).length;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading menu…</p>
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
        <Button variant="outline" size="sm" onClick={load}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Menu</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {items.length === 0
              ? "No items yet — add your first one"
              : `${items.length} item${items.length > 1 ? "s" : ""} · ${availableCount} available · ${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="size-4" /> Add item
        </Button>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <UtensilsCrossed className="size-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">Your menu is empty</h2>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Add your first menu item — students will see it when browsing your stall.
          </p>
          <Button onClick={openAdd} className="mt-6" size="sm">
            <Plus className="size-4" /> Add your first item
          </Button>
        </div>
      )}

      {/* ── Items grouped by category ────────────────────────────────────────── */}
      {categories.map((cat) => (
        <div key={cat}>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wide">
              {cat}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {grouped.get(cat)!.length} item{grouped.get(cat)!.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {grouped.get(cat)!.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleAvailable={handleToggleAvailable}
                togglingId={togglingId}
              />
            ))}
          </div>
          {deletingId && grouped.get(cat)!.some((i) => i._id === deletingId) && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Deleting…
            </div>
          )}
        </div>
      ))}

      {/* ── Add / Edit Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent side="right" className="flex flex-col sm:max-w-md overflow-y-auto">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>{editingItem ? "Edit item" : "Add menu item"}</SheetTitle>
            <SheetDescription>
              {editingItem
                ? "Update the details and hit save."
                : "Fill in the details for your new menu item."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">

            {/* ── Image upload ─────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div
                className="group relative flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50"
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
                      <span className="mt-1 text-xs font-medium text-white">Change photo</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearImage(); }}
                      className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Camera className="size-7" />
                    <span className="text-xs font-medium">Click to upload photo</span>
                    <span className="text-[11px]">JPG, PNG or WebP</span>
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

            {/* ── Name ─────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="item-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Masala Dosa"
                required
              />
            </div>

            {/* ── Price & Category ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="item-price">Price (₹) <span className="text-destructive">*</span></Label>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category <span className="text-destructive">*</span></Label>
                <Input
                  id="item-category"
                  list="category-suggestions"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Main Course"
                  required
                />
                <datalist id="category-suggestions">
                  {categories.map((c) => <option key={c} value={c} />)}
                  {["Starters", "Main Course", "Snacks", "Beverages", "Desserts", "Combos"].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* ── Availability ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Available</p>
                <p className="text-xs text-muted-foreground">Students can order this item</p>
              </div>
              <Switch
                checked={form.available}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, available: checked }))}
              />
            </div>

            {/* ── Options ──────────────────────────────────────────────────── */}
            <OptionsEditor
              options={form.options}
              onChange={(options) => setForm((f) => ({ ...f, options }))}
            />

            {/* ── Feedback ─────────────────────────────────────────────────── */}
            {submitError && (
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                <span>{submitError}</span>
                <button type="button" onClick={() => setSubmitError(null)} className="ml-3 rounded p-0.5 hover:bg-destructive/10">
                  <X className="size-4" />
                </button>
              </div>
            )}

            {submitSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <Check className="size-4 shrink-0" />
                {editingItem ? "Item updated!" : "Item added to menu!"}
              </div>
            )}
          </form>

          <SheetFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={closeSheet} disabled={submitting} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1"
            >
              {submitting ? (
                <><Loader2 className="size-4 animate-spin" /> {editingItem ? "Saving…" : "Adding…"}</>
              ) : (
                editingItem ? "Save changes" : "Add item"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  );
}
