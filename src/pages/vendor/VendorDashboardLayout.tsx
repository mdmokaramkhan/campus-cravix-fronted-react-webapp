import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChefHat,
  Images,
  LogOut,
  Menu,
  ShoppingBag,
  Star,
  Tag,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export const NAV_ITEMS = [
  { to: "/vendor/profile", label: "Profile",  icon: User,            description: "Identity & hours"   },
  { to: "/vendor/menu",    label: "Menu",      icon: UtensilsCrossed, description: "Items & categories" },
  { to: "/vendor/banners", label: "Banners",   icon: Images,          description: "Promotions"         },
  { to: "/vendor/orders",  label: "Orders",    icon: ShoppingBag,     description: "Incoming orders"    },
  { to: "/vendor/coupons", label: "Coupons",   icon: Tag,             description: "Discount codes"     },
  { to: "/vendor/reviews", label: "Reviews",   icon: Star,            description: "Customer feedback"  },
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// ── Reusable sidebar nav content ─────────────────────────────────────────────

function SidebarNav({
  onNavClick,
}: {
  onNavClick?: () => void;
}) {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const { user }  = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/login", { replace: true });
    onNavClick?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-2.5 px-4 py-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
          <ChefHat className="size-4 text-primary-foreground" />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
          CampusCravix
        </span>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Dashboard
        </p>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User + logout */}
      {user && (
        <div className="shrink-0 px-3 py-3">
          <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{user.name}</p>
              <p className="text-[11px] text-muted-foreground">Vendor account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4 shrink-0" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function VendorDashboardLayout() {
  const location               = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user }               = useAppSelector((state) => state.auth);

  const currentPage = NAV_ITEMS.find(
    (item) => location.pathname === item.to || location.pathname.startsWith(item.to + "/")
  );

  return (
    <div className="flex h-svh overflow-hidden bg-background">

      {/* ── Desktop sidebar (hidden on mobile) ──────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <SidebarNav />
      </aside>

      {/* ── Mobile sidebar (Sheet/drawer) ────────────────────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 bg-sidebar border-sidebar-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation menu</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top navbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="hidden text-muted-foreground sm:block">Vendor</span>
              {currentPage && (
                <>
                  <span className="hidden text-muted-foreground/40 sm:block">/</span>
                  <span className="font-semibold text-foreground">{currentPage.label}</span>
                </>
              )}
              {/* Mobile: show only page name */}
              {currentPage && (
                <span className="font-semibold text-foreground sm:hidden">{currentPage.label}</span>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>

            {/* Close button on desktop for a11y-friendly mobile UX — show user pill */}
            {user && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {initials(user.name)}
                </div>
                <span className="hidden text-sm font-medium text-foreground lg:block">{user.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
