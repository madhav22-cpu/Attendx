import { useNavigate, Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import logoAsset from "@/assets/attendx-logo.png.asset.json";
import { useAuth } from "@/lib/auth-context";

const navItems = [{ label: "Dashboard", to: "/student-dashboard" }] as const;

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function StudentHeader() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const name = profile?.name ?? "Student";

  const handleLogout = async () => {
    await logout();
    await navigate({ to: "/login", replace: true });
  };

  return (
    <header className="relative z-20 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-10">
      <Link to="/" className="-ml-6 flex items-center md:-ml-10">
        <img
          src={logoAsset.url}
          alt="AttendX"
          width={200}
          height={134}
          className="h-auto w-[150px] md:w-[200px]"
        />
      </Link>

      <nav className="order-3 flex w-full items-center gap-6 overflow-x-auto text-sm text-muted-foreground md:order-none md:w-auto md:gap-8">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="whitespace-nowrap transition-colors hover:text-foreground"
            activeProps={{ className: "font-medium text-foreground" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {initialsFor(name)}
        </span>
        <span className="hidden text-sm text-foreground sm:block">{name}</span>
        <button
          type="button"
          onClick={() => void handleLogout()}
          aria-label="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        >
          <LogOut size={15} strokeWidth={1.6} />
        </button>
      </div>
    </header>
  );
}
