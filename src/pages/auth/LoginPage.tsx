import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight, Phone, Shield, ShoppingBag } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCredentials } from "@/store/slices/authSlice";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";

type AuthMode = "student-login" | "vendor-login" | "vendor-signup";

const MODES: { id: AuthMode; label: string }[] = [
  { id: "student-login", label: "Student" },
  { id: "vendor-login", label: "Vendor" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token && user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      const redirectTo =
        user.role === "vendor"
          ? "/vendor"
          : from?.startsWith("/student")
            ? from
            : "/student";
      navigate(redirectTo, { replace: true });
    }
  }, [token, user, navigate, location.state]);

  const [mode, setMode] = useState<AuthMode>("student-login");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [stallNumber, setStallNumber] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  const handleSwitchMode = (m: AuthMode) => {
    if (m === mode) return;
    setMode(m);
    setError(null);
    setStep("phone");
    setOtp("");
  };

  const handleBack = () => {
    setStep("phone");
    setOtp("");
    setError(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (mode === "vendor-signup") {
      if (!name.trim()) {
        setError("Please enter your stall name");
        return;
      }
      if (!stallNumber.trim()) {
        setError("Please enter your stall number");
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "vendor-signup") {
        await authService.sendVendorSignupOtp(phone);
      } else {
        await authService.sendOtp(phone);
      }
      setStep("verify");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to send OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      if (mode === "vendor-signup") {
        const res = await authService.verifyVendorSignup({
          phone,
          otp,
          name,
          stallNumber,
          openingHours: [],
        });
        dispatch(setCredentials({ token: res.token, user: res.user, vendorId: res.vendor.id }));
        navigate("/vendor", { replace: true });
      } else {
        const res = await authService.verifyOtp(
          phone,
          otp,
          mode === "student-login" ? name || undefined : undefined
        );
        dispatch(
          setCredentials({ token: res.token, user: res.user, vendorId: res.user.vendorId ?? null })
        );
        const redirectTo =
          res.user.role === "vendor" ? "/vendor" : from.startsWith("/student") ? from : "/student";
        navigate(redirectTo, { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Verification failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const input =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-shadow";

  const btnPrimary =
    "flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-all min-h-[46px]";

  const btnSecondary =
    "flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent active:scale-[0.98] transition-all min-h-[46px]";

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="grid min-h-svh w-full lg:grid-cols-2">

        {/* ── Left panel ────────────────────────────────── */}
        <div className="flex min-h-svh flex-col items-center justify-center overflow-y-auto px-5 py-10 lg:px-10">
          <div className="my-auto w-full max-w-[420px]">

            {/* Brand mark above card */}
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                <ShoppingBag className="size-5" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                CampusCravix
              </span>
            </div>

            {/* Card */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/10 ring-1 ring-black/5">

              {/* Accent bar */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

              <div className="p-7 lg:p-9">

                {/* ── Heading ── */}
                <div className="text-center">
                  <h1 className="text-[1.6rem] font-extrabold leading-tight tracking-tight text-foreground">
                    {step === "verify"
                      ? "Verify your number"
                      : mode === "vendor-signup"
                        ? "Create your stall"
                        : "Welcome back"}
                  </h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step === "verify"
                      ? `We sent a 6-digit code to +91 ${phone}. Enter it below to continue.`
                      : mode === "student-login"
                        ? "Enter your phone to order from campus stalls — quick and easy."
                        : mode === "vendor-login"
                          ? "Sign in to manage your stall, menu, and incoming orders."
                          : "Register your food stall on CampusCravix and start accepting orders."}
                  </p>
                </div>

                {/* ── Mode tabs (only Student / Vendor, not signup) ── */}
                {mode !== "vendor-signup" && (
                  <div className="mt-6 flex rounded-xl border border-border bg-muted/50 p-1 gap-1">
                    {MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSwitchMode(m.id)}
                        className={cn(
                          "flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all",
                          mode === m.id
                            ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Divider ── */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {step === "verify" ? "Enter the code" : mode === "vendor-signup" ? "Stall details" : "Enter your phone"}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* ── Error ── */}
                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    <Shield className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ── Phone step ── */}
                {step === "phone" && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    {mode === "vendor-signup" && (
                      <div>
                        <label htmlFor="stallName" className="mb-2 block text-sm font-medium text-foreground">
                          Stall name <span className="text-destructive">*</span>
                        </label>
                        <input
                          id="stallName"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Spicy Corner"
                          className={input}
                          autoFocus
                        />
                      </div>
                    )}

                    {mode === "vendor-signup" && (
                      <div>
                        <label htmlFor="stallNumber" className="mb-2 block text-sm font-medium text-foreground">
                          Stall number <span className="text-destructive">*</span>
                        </label>
                        <input
                          id="stallNumber"
                          type="text"
                          value={stallNumber}
                          onChange={(e) => setStallNumber(e.target.value)}
                          placeholder="e.g. A-12"
                          className={input}
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                        <Phone className="size-3.5 text-muted-foreground" />
                        Phone number {mode === "vendor-signup" && <span className="text-destructive">*</span>}
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className={input}
                        autoFocus={mode !== "vendor-signup"}
                      />
                      {mode === "vendor-signup" && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          An OTP will be sent to verify this number
                        </p>
                      )}
                    </div>

                    <button type="submit" disabled={loading} className={cn(btnPrimary, "mt-2")}>
                      {loading ? "Sending OTP…" : mode === "vendor-signup" ? "Send OTP to verify" : "Continue"}
                      {!loading && <ChevronRight className="size-4" />}
                    </button>
                  </form>
                )}

                {/* ── Verify step ── */}
                {step === "verify" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <label htmlFor="otp" className="mb-2 block text-sm font-medium text-foreground">
                        6-digit code
                      </label>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="• • • • • •"
                        className={cn(input, "text-center tracking-[0.4em] text-base font-semibold")}
                        autoFocus
                      />
                    </div>

                    {mode === "student-login" && (
                      <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                          Your name
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full name"
                          className={input}
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button type="button" onClick={handleBack} className={btnSecondary}>
                        <ArrowLeft className="size-4" />
                        Back
                      </button>
                      <button type="submit" disabled={loading} className={btnPrimary}>
                        {loading ? "Verifying…" : mode === "vendor-signup" ? "Create account" : "Sign in"}
                        {!loading && <ChevronRight className="size-4" />}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Register as vendor link ── */}
                {mode !== "vendor-signup" && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Want to sell on campus?{" "}
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("vendor-signup")}
                      className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      Register as a vendor
                    </button>
                  </p>
                )}
                {mode === "vendor-signup" && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("student-login")}
                      className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      Sign in
                    </button>
                  </p>
                )}

                {/* ── Footer note ── */}
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  By continuing you agree to our{" "}
                  <span className="cursor-pointer underline underline-offset-2 hover:text-foreground">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="cursor-pointer underline underline-offset-2 hover:text-foreground">
                    Privacy Policy
                  </span>
                  .
                </p>

              </div>
            </div>

          </div>
        </div>

        {/* ── Right panel: Branding ─────────────────────── */}
        <div className="relative hidden min-h-svh overflow-hidden border-l bg-gradient-to-br from-primary/10 via-primary/5 to-background lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-14">
          {/* Soft radial glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_60%_40%,oklch(0.65_0.18_55/0.18),transparent)]" />

          <div className="relative z-10 max-w-xs space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30">
              <ShoppingBag className="size-8" />
            </div>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                Campus food,<br />made simple.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Discover stalls, browse menus, and place orders in seconds — no waiting in line.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-left">
              {[
                { emoji: "🍱", text: "Browse menus from campus vendors" },
                { emoji: "⚡", text: "Get notified when your order is ready" },
                { emoji: "🎟️", text: "Apply coupons for instant discounts" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm backdrop-blur-sm">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-foreground/80">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
