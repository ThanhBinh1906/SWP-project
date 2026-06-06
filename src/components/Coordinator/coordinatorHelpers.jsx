import { icons } from "./CoordinatorUI";

export function formatDate(iso) {
  if (!iso) return "—";
  return iso.split("T")[0];
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function getApiMessage(err, fallback) {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (data?.title && data?.title !== "One or more validation errors occurred.") {
    return data.title;
  }
  if (data?.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors).flat().filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }
  if (err?.message && !err.message.startsWith("Request failed with status code")) {
    return err.message;
  }
  return fallback;
}

export const TEAM_MIN_MEMBERS = 3;

export function FormError({ msg }) {
  if (!msg) return null;
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-xl text-sm"
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#dc2626",
      }}
    >
      <icons.X className="w-4 h-4 flex-shrink-0" />
      {msg}
    </div>
  );
}

export function LoadingState({ label = "Đang tải..." }) {
  return (
    <div className="flex items-center justify-center py-12 gap-2 text-sm text-slate-400">
      <icons.Clock
        className="w-4 h-4 animate-spin"
        style={{ color: "#F26F21" }}
      />
      {label}
    </div>
  );
}

export function ApiErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center py-10 gap-3">
      <p className="text-sm text-red-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-semibold text-[#F26F21] hover:underline"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
