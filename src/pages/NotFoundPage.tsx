import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">404</h1>
      <p className="text-muted-foreground">Page not found.</p>
      <Link
        to="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go home
      </Link>
    </div>
  );
}
