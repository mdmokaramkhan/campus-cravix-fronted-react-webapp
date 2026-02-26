import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";

export default function VendorDashboardLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="flex w-56 flex-col border-r border-border bg-card p-4">
        <h2 className="font-semibold text-foreground">Vendor Dashboard</h2>
        {user && (
          <p className="mt-2 text-sm text-muted-foreground">{user.name}</p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-4" />
          Log out
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          Navigation coming in Phase 2.
        </p>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
