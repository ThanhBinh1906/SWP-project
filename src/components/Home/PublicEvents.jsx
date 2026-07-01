import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Loader2,
  MapPin,
  Monitor,
  Search,
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
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function EventCard({ event }) {
  const description = event.description || "";
  const fallbackDescription = getPlainDescription(description);

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-orange-400/35 hover:bg-white/[0.055]">
      <div className="relative h-52 overflow-hidden bg-[#111827]">
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

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
            {formatDate(event.startDate)} - {formatDate(event.endDate)}
          </p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-white">
            {event.name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-slate-300">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
            {event.isOnline ? (
              <Monitor className="h-4 w-4 text-orange-300" />
            ) : (
              <MapPin className="h-4 w-4 text-orange-300" />
            )}
            {event.isOnline ? "Online" : event.location || "Địa điểm sẽ cập nhật"}
          </span>
        </div>

        {description ? (
          <SafeHtml
            html={description}
            className="event-rich-content prose prose-invert prose-sm max-w-none line-clamp-5 text-slate-300 prose-strong:text-white prose-headings:text-white"
          />
        ) : (
          <p className="text-sm leading-6 text-slate-400">
            {fallbackDescription || "Thông tin sự kiện sẽ được cập nhật sớm."}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <a
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-[#F26F21] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d95b13] active:scale-[0.98]"
          >
            Đăng ký
          </a>
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

export default function PublicEvents() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async (keyword = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await rankingService.getLandingEvents({
        pageNumber: 1,
        pageSize: 6,
        status: "Registration|Active|Upcoming",
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

  const featured = useMemo(() => events.slice(0, 6), [events]);

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
              Danh sách này lấy trực tiếp từ hệ thống public event. Nội dung mô
              tả hỗ trợ rich text từ Tiptap.
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
          <div className="grid gap-5 lg:grid-cols-3">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
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
    </section>
  );
}
