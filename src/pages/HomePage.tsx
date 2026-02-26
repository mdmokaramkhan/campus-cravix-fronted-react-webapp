import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          CampusCravix
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Welcome to campus food ordering. Order from your favorite vendors, pick up when ready.
        </p>
        <Link
          to="/auth/login"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
