import { Menu } from "lucide-react";
import { useSelector } from "react-redux";
import NotificationBell from "../shared/NotificationBell";

export function Header({ onMenuClick, onNotificationsLoaded }) {
  const { user } = useSelector((s) => s.auth); // lấy user thật từ Redux
  return (
    <header
      className="flex items-center justify-between px-8 py-4 border-b"
      style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}
    >
      {/* Mobile menu button */}
      <button
        className="block md:hidden text-gray-600"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>
      {/* Greeting */}
      <div className="flex-1 min-w-0 ml-4">
        <p
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "#6B7280" }}
        >
          Welcome back
        </p>
        <h1
          className="text-sm sm:text-xl font-bold tracking-tight truncate"
          style={{
            fontFamily: "'Montserrat', 'Inter', sans-serif",
            color: "#111827",
          }}
        >
          {user.username}{" "}
          <span className="font-semibold text-xs sm:text-sm" style={{ color: "#F26F21" }}>
            / Team Alpha
          </span>
        </h1>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        <NotificationBell
          ariaLabel="Leader notifications"
          onNotificationsLoaded={onNotificationsLoaded}
        />
      </div>
    </header>
  );
}
