import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  Clock,
  Images,
  Loader2,
  MapPin,
  ShoppingBag,
  Star,
  Store,
  Tag,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { vendorService, type OpeningHour, type VendorProfile } from "@/services/vendorService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const FULL_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const DEFAULT_HOURS: OpeningHour[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i, open: "08:00", close: "20:00",
}));

const QUICK_LINKS = [
  {
    to: "/vendor/menu",
    label: "Menu",
    description: "What you sell",
    icon: UtensilsCrossed,
    bg: "bg-orange-100 dark:bg-orange-900/20",
    fg: "text-orange-600 dark:text-orange-400",
  },
  {
    to: "/vendor/banners",
    label: "Banners",
    description: "Highlight deals",
    icon: Images,
    bg: "bg-violet-100 dark:bg-violet-900/20",
    fg: "text-violet-600 dark:text-violet-400",
  },
  {
    to: "/vendor/orders",
    label: "Orders",
    description: "See new orders",
    icon: ShoppingBag,
    bg: "bg-blue-100 dark:bg-blue-900/20",
    fg: "text-blue-600 dark:text-blue-400",
  },
  {
    to: "/vendor/coupons",
    label: "Coupons",
    description: "Offer discounts",
    icon: Tag,
    bg: "bg-emerald-100 dark:bg-emerald-900/20",
    fg: "text-emerald-600 dark:text-emerald-400",
  },
  {
    to: "/vendor/reviews",
    label: "Reviews",
    description: "What students say",
    icon: Star,
    bg: "bg-amber-100 dark:bg-amber-900/20",
    fg: "text-amber-600 dark:text-amber-400",
  },
];

// ── Hour-row helpers ───────────────────────────────────────────────────────────

interface HourRow { dayOfWeek: number; enabled: boolean; open: string; close: string; }

function toHourRows(hours: OpeningHour[]): HourRow[] {
  return Array.from({ length: 7 }, (_, i) => {
    const found = hours.find((h) => h.dayOfWeek === i);
    return { dayOfWeek: i, enabled: !!found, open: found?.open ?? "08:00", close: found?.close ?? "20:00" };
  });
}

function fromHourRows(rows: HourRow[]): OpeningHour[] {
  return rows.filter((r) => r.enabled).map(({ dayOfWeek, open, close }) => ({ dayOfWeek, open, close }));
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function VendorProfilePage() {
  const [profile,  setProfile]  = useState<VendorProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const [name,        setName]        = useState("");
  const [stallNumber, setStallNumber] = useState("");
  const [isOpen,      setIsOpen]      = useState(true);
  const [hourRows,    setHourRows]    = useState<HourRow[]>(toHourRows(DEFAULT_HOURS));

  const [saving,      setSaving]      = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  const [coverUploading, setCoverUploading] = useState(false);
  const [picUploading,   setPicUploading]   = useState(false);
  const [coverPreview,   setCoverPreview]   = useState<string | null>(null);
  const [picPreview,     setPicPreview]     = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const picInputRef   = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await vendorService.getProfile();
      setProfile(data); setName(data.name); setStallNumber(data.stallNumber);
      setIsOpen(data.isOpen); setHourRows(toHourRows(data.openingHours));
    } catch { setError("Failed to load profile. Please try again."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      const updated = await vendorService.updateProfile({
        name: name.trim(), stallNumber: stallNumber.trim(), isOpen,
        openingHours: fromHourRows(hourRows),
      });
      setProfile(updated); setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch { setSaveError("Failed to save changes. Please try again."); }
    finally { setSaving(false); }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCoverPreview(URL.createObjectURL(file)); setCoverUploading(true);
    try {
      const updated = await vendorService.uploadCoverImage(file);
      setProfile(updated); setCoverPreview(null);
    } catch { setCoverPreview(null); setSaveError("Failed to upload cover image."); }
    finally { setCoverUploading(false); if (coverInputRef.current) coverInputRef.current.value = ""; }
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setPicPreview(URL.createObjectURL(file)); setPicUploading(true);
    try {
      const updated = await vendorService.uploadProfilePic(file);
      setProfile(updated); setPicPreview(null);
    } catch { setPicPreview(null); setSaveError("Failed to upload profile picture."); }
    finally { setPicUploading(false); if (picInputRef.current) picInputRef.current.value = ""; }
  };

  const updateHourRow = (dayOfWeek: number, field: "enabled" | "open" | "close", value: boolean | string) =>
    setHourRows((rows) => rows.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, [field]: value } : r)));

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
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
        <Button variant="outline" size="sm" onClick={loadProfile}>Try again</Button>
      </div>
    );
  }

  const coverSrc = coverPreview ?? profile?.coverImage ?? null;
  const picSrc   = picPreview   ?? profile?.profilePic  ?? null;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">

      {/* ── Tip banner ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
        <span className="text-sm">💡</span>
        <p className="text-xs text-muted-foreground">
          Students check your hours before ordering — keep them up to date and flip <span className="font-medium text-foreground">Store Status</span> off if you close early.
        </p>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {saveError && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          <span>{saveError}</span>
          <button type="button" onClick={() => setSaveError(null)} className="ml-4 rounded p-0.5 hover:bg-destructive/10">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 1 — Hero card (full width)                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card className="gap-0 overflow-hidden p-0">
        {/* Cover photo */}
        <div className="group relative h-40 w-full bg-linear-to-br from-primary/20 via-primary/10 to-muted sm:h-52">
          {coverSrc
            ? <img src={coverSrc} alt="Cover" className="h-full w-full object-cover" />
            : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 opacity-30">
                <Store className="size-12 text-foreground" />
                <span className="text-xs font-medium text-foreground">No cover photo yet</span>
              </div>
            )
          }
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/50 to-transparent" />

          {/* Cover upload — visible on hover */}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {coverUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            {coverUploading ? "Uploading…" : "Change cover"}
          </button>
          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
        </div>

        {/* Identity row */}
        <div className="relative px-4 pb-5 sm:px-6">
          {/* Profile picture — overlaps cover */}
          <div className="absolute -top-10 left-4 sm:left-6">
            <div className="relative">
              <div className="size-20 overflow-hidden rounded-xl border-4 border-card bg-muted shadow-lg ring-1 ring-border sm:size-24 sm:rounded-2xl">
                {picSrc
                  ? <img src={picSrc} alt={profile?.name} className="h-full w-full object-cover" />
                  : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
                      <Store className="size-8 text-primary/50 sm:size-9" />
                    </div>
                  )
                }
              </div>
              <button
                type="button"
                onClick={() => picInputRef.current?.click()}
                disabled={picUploading}
                className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 sm:size-8"
              >
                {picUploading ? <Loader2 className="size-3 animate-spin sm:size-3.5" /> : <Camera className="size-3 sm:size-3.5" />}
              </button>
              <input ref={picInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePicChange} />
            </div>
          </div>

          {/* Name / meta / badge */}
          <div className="flex flex-wrap items-end justify-between gap-3 pt-12 sm:pt-14">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-foreground sm:text-2xl">{profile?.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  Stall {profile?.stallNumber}
                </span>
                {profile && profile.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">{profile.rating.toFixed(1)}</span>
                    <span>rating</span>
                  </span>
                )}
              </div>
            </div>

            {/* Status pill */}
            <div className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              isOpen
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            )}>
              <span className={cn(
                "size-1.5 rounded-full",
                isOpen ? "animate-pulse bg-green-500" : "bg-muted-foreground"
              )} />
              {isOpen ? "Open now" : "Closed"}
            </div>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 2 — Quick access (full width)                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick access
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {QUICK_LINKS.map(({ to, label, description, icon: Icon, bg, fg }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
            >
              <div className={cn("flex size-9 items-center justify-center rounded-lg", bg)}>
                <Icon className={cn("size-4", fg)} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
              <ArrowRight className={cn("size-3.5 transition-transform group-hover:translate-x-0.5", fg, "opacity-60")} />
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 3 — Stall details + Status (side by side on md+)               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

        {/* Stall details — 2 cols wide */}
        <Card className="md:col-span-2">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <Store className="size-4 text-primary" />
              <CardTitle className="text-base">Stall Details</CardTitle>
            </div>
            <CardDescription>This is what students see when they find your stall</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Stall name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spice Corner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stallNumber">Location</Label>
                <Input
                  id="stallNumber"
                  value={stallNumber}
                  onChange={(e) => setStallNumber(e.target.value)}
                  placeholder="e.g. A-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store status — 1 col wide */}
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", isOpen ? "bg-green-500" : "bg-muted-foreground")} />
              <CardTitle className="text-base">Store Status</CardTitle>
            </div>
            <CardDescription>Flip this off to stop receiving orders instantly</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className={cn(
              "flex items-center justify-between rounded-lg p-3",
              isOpen ? "bg-green-50 dark:bg-green-900/10" : "bg-muted/40"
            )}>
              <span className={cn(
                "text-sm font-medium",
                isOpen ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
              )}>
                {isOpen ? "Taking orders" : "Paused"}
              </span>
              <Switch checked={isOpen} onCheckedChange={setIsOpen} aria-label="Open for orders" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {isOpen
                ? "Students can see your stall and place orders right now."
                : "Your stall is hidden from students and no orders can come in."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 4 — Opening hours + Save (side by side on xl+)                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Opening hours — full width on small, 2/3 on xl */}
        <Card className="xl:col-span-2">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <CardTitle className="text-base">Opening Hours</CardTitle>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {hourRows.filter((r) => r.enabled).length} / 7 days
              </span>
            </div>
            <CardDescription>Check the days you're open and set your start and end times</CardDescription>
          </CardHeader>

          <div className="divide-y divide-border">
            {hourRows.map((row) => (
              <div
                key={row.dayOfWeek}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 transition-colors",
                  !row.enabled && "bg-muted/20"
                )}
              >
                {/* Day checkbox */}
                <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => updateHourRow(row.dayOfWeek, "enabled", e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span className={cn("text-sm font-medium", row.enabled ? "text-foreground" : "text-muted-foreground")}>
                    {FULL_DAYS[row.dayOfWeek]}
                  </span>
                </label>

                {row.enabled ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="time" value={row.open}
                      onChange={(e) => updateHourRow(row.dayOfWeek, "open", e.target.value)}
                      className="w-full min-w-0 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">—</span>
                    <input
                      type="time" value={row.close}
                      onChange={(e) => updateHourRow(row.dayOfWeek, "close", e.target.value)}
                      className="w-full min-w-0 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />
                  </div>
                ) : (
                  <span className="flex-1 text-sm text-muted-foreground/50">Closed</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Save card — stacks below on small, sidebar on xl */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base">Save changes</CardTitle>
              <CardDescription>
                Students see your updates right away
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {saveSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  <Check className="size-4 shrink-0" />
                  All changes saved!
                </div>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                Hit save when you're done editing. Your stall name, location, status, and hours will all update at once.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving
                  ? <><Loader2 className="size-4 animate-spin" /> Saving…</>
                  : "Save changes"
                }
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-2" />
    </div>
  );
}
