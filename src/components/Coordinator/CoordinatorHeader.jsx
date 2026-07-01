import { icons } from "./CoordinatorUI";
import NotificationBell from "../shared/NotificationBell";

export function CoordinatorHeader({ onMenuClick }) {
  const { Menu } = icons;

  return (
    <header
      className="flex items-center justify-between gap-4 border-b px-4 py-4 sm:px-8"
      style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}
    >
      <button
        className="block text-gray-600 md:hidden"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#6B7280" }}
        >
          Welcome back
        </p>
        <h1
          className="truncate text-lg font-bold tracking-tight sm:text-xl"
          style={{
            fontFamily: "'Montserrat', 'Inter', sans-serif",
            color: "#111827",
          }}
        >
          Coordinator Admin{" "}
          <span className="font-semibold" style={{ color: "#F26F21" }}>
            / SEAL Hackathon
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell ariaLabel="Coordinator notifications" />
      </div>
    </header>
  );
}
