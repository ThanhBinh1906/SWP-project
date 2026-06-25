import { LogOut, X } from "lucide-react";

const defaultAccent = {
  from: "#F26F21",
  to: "#7F1D1D",
  activeText: "#C2410C",
  glow: "rgba(242,111,33,0.28)",
};

function getInitial(name) {
  const value = String(name || "U").trim();
  return value ? value.charAt(0).toUpperCase() : "U";
}

export function RoleSidebar({
  active,
  onNav,
  isOpen,
  onClose,
  onLogout,
  navItems,
  brandTitle = "SEAL",
  brandSubtitle,
  brandMeta,
  BrandIcon,
  userName,
  roleLabel,
  accent = defaultAccent,
}) {
  const palette = { ...defaultAccent, ...accent };
  const sidebarClasses = `fixed inset-y-0 left-0 z-30 flex h-dvh w-64 max-w-[86vw] shrink-0 transform flex-col overflow-hidden text-white transition-transform duration-300 md:h-screen md:translate-x-0 ${
    isOpen ? "translate-x-0" : "-translate-x-full"
  }`;

  return (
    <aside
      className={sidebarClasses}
      style={{
        background: `linear-gradient(180deg, ${palette.from} 0%, ${palette.to} 100%)`,
        borderRight: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "14px 0 34px rgba(127,29,29,0.14)",
      }}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-lg p-1 text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
        onClick={onClose}
        aria-label="Đóng sidebar"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="shrink-0 px-5 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.28)",
              boxShadow: `0 16px 36px ${palette.glow}`,
            }}
          >
            {BrandIcon && <BrandIcon className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-[0.14em]">
              {brandTitle}
            </p>
            {brandSubtitle && (
              <p className="truncate text-xs font-medium text-white/70">
                {brandSubtitle}
              </p>
            )}
          </div>
        </div>

        {brandMeta && (
          <div className="mt-4 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
              Workspace
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {brandMeta}
            </p>
          </div>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
          Điều hướng
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNav(item.id);
                  onClose?.();
                }}
                className="group relative flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition duration-200 active:scale-[0.99]"
                style={{
                  background: isActive ? "rgba(255,255,255,0.94)" : "transparent",
                  borderColor: isActive
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0)",
                  color: isActive ? palette.activeText : "#FFFFFF",
                  boxShadow: isActive
                    ? "0 8px 18px rgba(43,15,6,0.12)"
                    : "none",
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition"
                  style={{
                    background: isActive
                      ? "rgba(242,111,33,0.1)"
                      : "rgba(255,255,255,0.13)",
                  }}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {item.label}
                  </span>
                  {item.labelVi && (
                    <span
                      className="block truncate text-[11px] font-medium"
                      style={{
                        color: isActive
                          ? "rgba(194,65,12,0.72)"
                          : "rgba(255,255,255,0.62)",
                      }}
                    >
                      {item.labelVi}
                    </span>
                  )}
                </span>
                <span
                  className="h-7 w-1 shrink-0 rounded-full transition"
                  style={{
                    background: isActive ? palette.activeText : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-white/15 bg-black/10 p-3">
        {(userName || roleLabel) && (
          <div className="mb-2.5 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/20 text-sm font-semibold">
              {getInitial(userName || roleLabel)}
            </div>
            <div className="min-w-0">
              {userName && (
                <p className="truncate text-sm font-semibold text-white">{userName}</p>
              )}
              {roleLabel && (
                <p className="truncate text-xs font-medium text-white/62">
                  {roleLabel}
                </p>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-[0.99]"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
