import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  GitBranch,
  Handshake,
  LayoutDashboard,
  Lightbulb,
  Lock,
  Menu,
  MoreHorizontal,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  Trash2,
  Trophy,
  Upload,
  UserCheck,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
import LoadingActionText from "../shared/LoadingActionText";

export const icons = {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  GitBranch,
  Handshake,
  LayoutDashboard,
  Lightbulb,
  Lock,
  Menu,
  MoreHorizontal,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  Trash2,
  Trophy,
  Upload,
  UserCheck,
  UserRoundCog,
  Users,
  X,
};

export function CoordinatorBadge({ tone = "neutral", children }) {
  const tones = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${
        tones[tone] || tones.neutral
      }`}
    >
      {children}
    </span>
  );
}

export function CoordinatorActionButton({
  variant = "secondary",
  children,
  icon: Icon,
  onClick,
  className = "",
  disabled = false,
}) {
  const isLoadingLabel =
    typeof children === "string" && /^Đang\s/i.test(children.trim());
  const content = isLoadingLabel ? (
    <LoadingActionText>{children.trim().replace(/\.{3}$/, "")}</LoadingActionText>
  ) : (
    children
  );
  const variants = {
    primary:
      "text-white border-[#C2410C] bg-[#C2410C] hover:bg-[#9A3412]",
    secondary:
      "text-slate-700 bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400",
    ghost:
      "text-slate-600 bg-transparent border-transparent hover:bg-slate-100",
    danger:
      "text-red-700 bg-transparent border-transparent hover:border-red-200 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors active:translate-y-px ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : ""
      } ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {content}
    </button>
  );
}

export function CoordinatorPanel({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-xl border bg-white p-5 transition-colors duration-200 hover:border-slate-300/80 animate-fade-in ${className}`}
      style={{
        borderColor: "#E5E7EB",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
      }}
    >
      {(title || actions) && (
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            {Icon && (
              <div
                className="mt-0.5 flex h-5 w-5 items-center justify-center"
              >
                <Icon className="h-4 w-4" style={{ color: "#F26F21" }} />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-700">{title}</h3>}
              {subtitle && (
                <p className="mt-1 text-sm font-normal text-slate-600">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function CoordinatorStatCard({
  label,
  value,
  icon: Icon,
  tone = "orange",
  delta,
  helper,
}) {
  const toneMap = {
    orange: ["rgba(242,111,33,0.1)", "rgba(242,111,33,0.2)", "#F26F21"],
    blue: ["rgba(37,99,235,0.08)", "rgba(37,99,235,0.18)", "#2563EB"],
    green: ["rgba(5,150,105,0.08)", "rgba(5,150,105,0.18)", "#059669"],
    amber: ["rgba(217,119,6,0.08)", "rgba(217,119,6,0.18)", "#D97706"],
    red: ["rgba(220,38,38,0.08)", "rgba(220,38,38,0.18)", "#DC2626"],
  };
  const [bg, border, color] = toneMap[tone] || toneMap.orange;

  return (
    <div
      className="rounded-xl border bg-white p-5 transition-colors duration-200 hover:border-slate-300/80"
      style={{
        borderColor: "#E5E7EB",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        {Icon && (
          <div
            className="flex h-11 w-11 items-center justify-center rounded-md"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        )}
      </div>
      {(delta || helper) && (
        <div className="mt-4 flex items-center justify-between gap-2 text-xs">
          {delta && (
            <span className="font-mono font-semibold" style={{ color }}>
              {delta}
            </span>
          )}
          {helper && <span className="text-slate-700">{helper}</span>}
        </div>
      )}
    </div>
  );
}

export function CoordinatorProgressBar({
  value = 0,
  label,
  color = "#F26F21",
}) {
  return (
    <div>
      {(label || value !== undefined) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-slate-700">{label}</span>
          )}
          <span className="font-mono font-semibold text-slate-900">{value}%</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export function CoordinatorTable({
  columns,
  rows,
  renderCell,
  emptyMessage = "No records found",
  rowClassName,
}) {
  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-700">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`transition-colors duration-150 hover:bg-slate-50 ${
                rowClassName ? rowClassName(row) : ""
              }`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="whitespace-nowrap px-5 py-4 text-slate-700"
                >
                  {renderCell ? renderCell(row, column.key) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ModalShell({
  title,
  children,
  onClose,
  actions,
  maxWidthClass = "max-w-xl",
  maxHeightClass = "max-h-[80vh]",
  overlayClassName = "",
  panelClassName = "",
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm animate-fade-in ${overlayClassName}`}
    >
      <div
        className={`relative isolate flex min-w-0 w-full ${maxWidthClass} ${maxHeightClass} flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ${panelClassName}`}
      >
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-700 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="modal-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pb-4">
          {children}
        </div>
        {actions && (
          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
