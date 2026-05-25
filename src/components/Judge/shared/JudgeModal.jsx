import { judgeIcons } from "./judgeIcons";

export function JudgeModal({ title, subtitle, children, footer, onClose, maxWidth = "max-w-3xl" }) {
  const { X } = judgeIcons;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white px-5 py-4" style={{ borderColor: "#E5E7EB" }}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50" onClick={onClose} aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="border-t px-5 py-4" style={{ borderColor: "#E5E7EB" }}>{footer}</div>}
      </div>
    </div>
  );
}
