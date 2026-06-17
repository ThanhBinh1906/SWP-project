import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  Inbox,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import notificationService from "../../services/notificationService";

const PAGE_SIZE = 10;

function getNotificationItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatNotificationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getNotificationTone(type) {
  const normalizedType = String(type || "").toLowerCase();
  if (normalizedType.includes("team")) {
    return {
      label: "Đội thi",
      bg: "#EEF6FF",
      color: "#2563EB",
      border: "#BFDBFE",
    };
  }
  if (normalizedType.includes("score") || normalizedType.includes("judge")) {
    return {
      label: "Chấm điểm",
      bg: "#FFF6F0",
      color: "#F26F21",
      border: "#FFD0B5",
    };
  }
  if (normalizedType.includes("system")) {
    return {
      label: "Hệ thống",
      bg: "#F5F3FF",
      color: "#7C3AED",
      border: "#DDD6FE",
    };
  }
  return {
    label: type || "Thông báo",
    bg: "#F8FAFC",
    color: "#475569",
    border: "#E2E8F0",
  };
}

export default function NotificationBell({ ariaLabel = "Thông báo" }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.isRead);
    }
    return notifications;
  }, [filter, notifications]);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await notificationService.getAll({
        pageNumber: 1,
        pageSize: PAGE_SIZE,
      });
      setNotifications(getNotificationItems(res.data?.data));
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể tải danh sách thông báo.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      loadNotifications();
    }
  };

  const markAsRead = async (notification) => {
    if (!notification?.id || notification.isRead) return;
    const id = notification.id;

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: notification.isRead } : item,
        ),
      );
      setError(
        err?.response?.data?.message || "Không thể đánh dấu thông báo đã đọc.",
      );
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || actionLoading) return;
    const previousNotifications = notifications;
    setActionLoading(true);
    setError("");
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      setNotifications(previousNotifications);
      setError(
        err?.response?.data?.message ||
          "Không thể đánh dấu tất cả thông báo đã đọc.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] transition-all duration-200 hover:border-[#FFD0B5] hover:bg-[#FFF6F0] active:scale-[0.95]"
        onClick={handleToggle}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4 text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F26F21] px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Thông báo</h2>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0
                    ? `${unreadCount} thông báo chưa đọc`
                    : "Bạn đã đọc hết thông báo"}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#D94B0D] transition hover:bg-[#FFF6F0] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={markAllAsRead}
                disabled={unreadCount === 0 || actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Đọc tất cả
              </button>
            </div>

            <div className="mt-3 flex rounded-full bg-slate-100 p-1">
              {[
                { key: "all", label: "Tất cả" },
                { key: "unread", label: "Chưa đọc" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    filter === item.key
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto px-2 py-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#F26F21]" />
                Đang tải thông báo...
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="font-semibold text-slate-900">
                  {filter === "unread"
                    ? "Không có thông báo chưa đọc"
                    : "Chưa có thông báo"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Khi hệ thống có cập nhật mới, thông báo sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {visibleNotifications.map((notification) => {
                  const tone = getNotificationTone(notification.type);
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      className={`group flex w-full gap-3 rounded-xl px-3 py-3 text-left transition ${
                        notification.isRead
                          ? "hover:bg-slate-50"
                          : "bg-[#FFF8F3] hover:bg-[#FFF1E8]"
                      }`}
                      onClick={() => markAsRead(notification)}
                    >
                      <span
                        className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                        style={{
                          background: tone.bg,
                          borderColor: tone.border,
                          color: tone.color,
                        }}
                      >
                        {tone.label.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span className="line-clamp-1 font-semibold text-slate-950">
                            {notification.title || "Thông báo"}
                          </span>
                          {!notification.isRead && (
                            <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#F26F21]" />
                          )}
                        </span>
                        <span className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                          {notification.message || "Bạn có một cập nhật mới."}
                        </span>
                        <span className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                          <span
                            className="rounded-full border px-2 py-0.5"
                            style={{
                              borderColor: tone.border,
                              color: tone.color,
                            }}
                          >
                            {tone.label}
                          </span>
                          <span>{formatNotificationTime(notification.createdAt)}</span>
                          {notification.isRead && (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <Check className="h-3 w-3" />
                              Đã đọc
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
