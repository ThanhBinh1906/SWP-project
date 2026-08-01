import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Loader2,
  MapPin,
  Monitor,
  Search,
  X,
} from "lucide-react";
import rankingService from "../../services/rankingService";
import SafeHtml from "../shared/SafeHtml";

function unwrapPublicEvents(response) {
  const payload = response?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function formatDate(value) {
  if (!value) return "Chưa có thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thời gian";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getPlainDescription(html) {
  const raw = String(html || "");
  if (typeof document !== "undefined") {
    const container = document.createElement("div");
    container.innerHTML = raw;
    return (container.textContent || container.innerText || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSummary(html, limit = 190) {
  const text = getPlainDescription(html);
  if (!text) return "";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}...`;
}

function getEventDescription(event) {
  return event.descriptionHtml || event.description || "";
}

function EventCard({ event, onOpenDetail }) {
  const description = getEventDescription(event);
  const summary = getSummary(description);

  return (
    <article className="group grid w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:border-orange-400/35 hover:bg-white/[0.055] lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <div className="relative min-h-[260px] overflow-hidden bg-[#111827] sm:min-h-[340px] lg:min-h-[440px]">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={`Banner ${event.name}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(242,111,33,0.22),transparent_32%),linear-gradient(135deg,#111827,#080A0F)]">
            <CalendarDays className="h-10 w-10 text-orange-300/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-[#080A0F]/20 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-orange-300/30 bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-100">
            {event.status || "Registration"}
          </span>
          {event.trackCount !== undefined && (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              {event.trackCount} track
            </span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
              {formatDate(event.startDate)} - {formatDate(event.endDate)}
            </p>
            <h3 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
              {event.name}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
              {event.isOnline ? (
                <Monitor className="h-4 w-4 text-orange-300" />
              ) : (
                <MapPin className="h-4 w-4 text-orange-300" />
              )}
              {event.isOnline ? "Online" : event.location || "Địa điểm sẽ cập nhật"}
            </span>
          </div>

          <p className="max-w-2xl text-base leading-7 text-slate-400">
            {summary || "Thông tin sự kiện sẽ được cập nhật sớm."}
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => onOpenDetail(event)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:border-orange-300/40 hover:bg-orange-500/10 active:scale-[0.98]"
          >
            Xem chi tiết
          </button>
          <a
            href="/results"
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-200 transition hover:text-white"
          >
            Xem kết quả
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

function EventDetailModal({ event, onClose, onRegisterClick }) {
  if (!event) return null;

  const description = getEventDescription(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <article className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#080A0F] shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
              {event.status || "Registration"}
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
              {event.name}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {formatDate(event.startDate)} - {formatDate(event.endDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-orange-300/40 hover:text-white"
            aria-label="Đóng chi tiết sự kiện"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          {event.bannerUrl && (
            <img
              src={event.bannerUrl}
              alt={`Banner ${event.name}`}
              className="mb-6 max-h-[360px] w-full rounded-2xl object-cover"
            />
          )}

          <div className="mb-6 flex flex-wrap gap-2 text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
              {event.isOnline ? (
                <Monitor className="h-4 w-4 text-orange-300" />
              ) : (
                <MapPin className="h-4 w-4 text-orange-300" />
              )}
              {event.isOnline ? "Online" : event.location || "Địa điểm sẽ cập nhật"}
            </span>
            {event.trackCount !== undefined && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
                {event.trackCount} track
              </span>
            )}
          </div>

          {description ? (
            <SafeHtml
              html={description}
              className="event-rich-content prose prose-invert max-w-none text-slate-300 prose-headings:text-white prose-strong:text-white prose-li:marker:text-orange-300"
            />
          ) : (
            <p className="text-sm leading-6 text-slate-400">
              Thông tin sự kiện sẽ được cập nhật sớm.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-slate-500">
            Hãy đọc kỹ thông tin sự kiện trước khi đăng ký để chuẩn bị đúng yêu cầu.
          </p>
          <button
            type="button"
            onClick={onRegisterClick}
            className="inline-flex items-center justify-center rounded-xl bg-[#F26F21] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#d95b13] active:scale-[0.98]"
          >
            Đăng ký tham gia
          </button>
        </div>
      </article>
    </div>
  );
}

export default function PublicEvents() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async (keyword = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await rankingService.getLandingEvents({
        pageNumber: 1,
        pageSize: 1,
        status: "Registration|Active",
        search: keyword || undefined,
      });
      setEvents(unwrapPublicEvents(response));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Không thể tải danh sách sự kiện public.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const featured = useMemo(() => events.slice(0, 1), [events]);

  const submitSearch = (event) => {
    event.preventDefault();
    loadEvents(search.trim());
  };

  return (
    <section id="events" className="relative overflow-hidden bg-[#080A0F] py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
      <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-orange-500/[0.035] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
              Sự kiện đang mở
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
              Chọn một cuộc thi phù hợp rồi bắt đầu với đội của bạn.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Theo dõi các cuộc thi đang mở, xem chủ đề phù hợp và chuẩn bị đội hình trước khi
              đăng ký tham gia.
            </p>
          </div>

          <form
            onSubmit={submitSearch}
            className="flex min-h-12 w-full max-w-md items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên sự kiện..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-orange-100"
            >
              Tìm
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-slate-300">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-400" />
            Đang tải sự kiện...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-6 text-sm font-semibold text-red-100">
            {error}
          </div>
        ) : featured.length ? (
          <div className="w-full">
            {featured.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onOpenDetail={setSelectedEvent}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.03] px-6 py-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-orange-300" />
            <p className="mt-4 text-lg font-bold text-white">
              Chưa có sự kiện public phù hợp
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Hãy thử đổi từ khóa hoặc quay lại sau khi Coordinator mở đăng ký.
            </p>
          </div>
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegisterClick={() => {
          setSelectedEvent(null);
          window.location.href = "/register";
        }}
      />
    </section>
  );
}
