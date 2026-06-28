import { LogOut, X } from "lucide-react";

const defaultAccent = {
  from: "#F97316",
  to: "#9A3412",
  activeText: "#C2410C",
  soft: "rgba(255, 255, 255, 0.12)",
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
  const sidebarClasses = `fixed inset-y-0 left-0 z-30 flex h-dvh w-[260px] max-w-[86vw] shrink-0 transform flex-col overflow-hidden text-white transition-transform duration-300 md:h-screen md:translate-x-0 ${
    isOpen ? "translate-x-0" : "-translate-x-full"
  }`;

  return (
    <aside
      className={sidebarClasses}
      style={{
        background: `linear-gradient(180deg, ${palette.from} 0%, ${palette.to} 100%)`,
        borderRight: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "10px 0 28px rgba(127,29,29,0.12)",
      }}
    >
      <button
        type="button"
        className="absolute right-3 top-3 rounded-lg p-1.5 text-white/75 transition hover:bg-white/10 hover:text-white md:hidden"
        onClick={onClose}
        aria-label="Đóng sidebar"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="shrink-0 px-5 pb-3 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            {BrandIcon && <BrandIcon className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-[0.08em]">
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
          <p className="mt-4 truncate rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white/75">
            {brandMeta}
          </p>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                className="group relative flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition duration-200 active:scale-[0.99]"
                style={{
                  background: isActive ? "rgba(255,255,255,0.94)" : "transparent",
                  color: isActive ? palette.activeText : "#FFFFFF",
                  boxShadow: isActive
                    ? "0 10px 22px rgba(43,15,6,0.12)"
                    : "none",
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition"
                  style={{
                    background: isActive
                      ? "rgba(249,115,22,0.10)"
                      : palette.soft,
                  }}
                >
                  {Icon && <Icon className="h-[18px] w-[18px]" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-5">
                    {item.label}
                  </span>
                  {item.labelVi && (
                    <span
                      className="block truncate text-xs font-medium leading-4"
                      style={{
                        color: isActive
                          ? "rgba(194,65,12,0.68)"
                          : "rgba(255,255,255,0.62)",
                      }}
                    >
                      {item.labelVi}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/10 bg-black/10 px-4 py-4">
        {(userName || roleLabel) && (
          <div className="mb-3 flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold">
              {getInitial(userName || roleLabel)}
            </div>
            <div className="min-w-0">
              {userName && (
                <p className="truncate text-sm font-semibold text-white">{userName}</p>
              )}
              {roleLabel && (
                <p className="truncate text-xs font-medium text-white/60">
                  {roleLabel}
                </p>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-[0.99]"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
