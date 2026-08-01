import { useCallback, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveEvent } from "../store/eventSlice";
import { fetchMyTeam } from "../store/teamSlice";
import { Loader2 } from "lucide-react";
import { Sidebar } from "../components/UserDashboard/Sidebar";
import { Header } from "../components/UserDashboard/Header";
import { ChallengesView } from "../components/UserDashboard/ChallengesView";
import { SubmitView } from "../components/UserDashboard/SubmitView";
import { TeamView } from "../components/UserDashboard/TeamView";
import { RankingView } from "../components/UserDashboard/RankingView";
import TeamEliminationOverlay from "../components/UserDashboard/TeamEliminationOverlay";
import notificationService from "../services/notificationService";

const NOTIFICATION_PAGE_SIZE = 10;
const TEAM_STORAGE_KEYS = ["team", "myTeam", "teamState", "persist:team"];

function clearCachedTeamState() {
  TEAM_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function getNotificationItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

const viewTitles = {
  challenges: {
    title: "View Challenges",
    sub: "Browse all active and upcoming challenges",
  },
  submit: {
    title: "Nộp bài dự án",
    sub: "Cập nhật link dự án, slide và mã nguồn GitHub",
  },
  team: {
    title: "Team Information",
    sub: "Manage your team and track progress",
  },
  ranking: {
    title: "Bảng xếp hạng",
    sub: "Xem kết quả Final Round của Track và toàn Event",
  },
};

export default function UserDashboard() {
  const [activeNav, setActiveNav] = useState("challenges");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [eliminationNotice, setEliminationNotice] = useState(null);
  const lastTeamFetchEventRef = useRef();
  const dispatch = useDispatch();

  const {
    activeEvent,
    activeEventId,
    loading: eventLoading,
    error: eventError,
    fetched: eventFetched,
  } = useSelector((s) => s.event);
  const { myTeam, fetched: teamFetched, loading: teamLoading } = useSelector(
    (s) => s.team,
  );

  const applyNotifications = useCallback((notifications) => {
    if (!myTeam) {
      setEliminationNotice(null);
      return;
    }

    const eliminated = notifications.find(
      (item) => String(item?.type || "").toUpperCase() === "ROUND_ELIMINATED",
    );
    setEliminationNotice(eliminated || null);
  }, [myTeam]);

  useEffect(() => {
    if (!myTeam) {
      setEliminationNotice(null);
      clearCachedTeamState();
    }
  }, [myTeam]);

  useEffect(() => {
    let active = true;

    notificationService
      .getAll({ pageNumber: 1, pageSize: NOTIFICATION_PAGE_SIZE })
      .then((response) => {
        if (active) {
          applyNotifications(getNotificationItems(response.data?.data));
        }
      })
      .catch(() => {
        if (active) applyNotifications([]);
      })
      .finally(() => {
        if (active) setNotificationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyNotifications]);

  // Step 1: fetch active event
  useEffect(() => {
    if (!eventFetched && !eventLoading) {
      dispatch(fetchActiveEvent());
    }
  }, [dispatch, eventFetched, eventLoading]);

  // Refresh the event lifecycle before showing Team management. The event can
  // move from Registration to Active while the Leader dashboard is still open.
  useEffect(() => {
    if (activeNav === "team") {
      dispatch(fetchActiveEvent());
    }
  }, [activeNav, dispatch]);

  // Step 2: only fetch team data while there is a current Registration/Active event.
  useEffect(() => {
    if (!eventFetched || !activeEventId) return;

    const eventKey = activeEventId;

    if (!teamFetched || lastTeamFetchEventRef.current !== eventKey) {
      lastTeamFetchEventRef.current = eventKey;
      dispatch(fetchMyTeam());
    }
  }, [activeEventId, dispatch, eventFetched, teamFetched]);

  const loading =
    notificationsLoading ||
    eventLoading ||
    (teamLoading && !teamFetched);

  const isEliminated = Boolean(eliminationNotice);
  const eventEnded =
    eventFetched && !eventLoading && !eventError && !activeEventId;
  const eventStatus = String(activeEvent?.status || "").trim();
  const isRegistrationOpen =
    !eventError && eventStatus.toLowerCase() === "registration";
  const isEventActive =
    !eventError && eventStatus.toLowerCase() === "active";
  const teamReadOnly = isEliminated || !isRegistrationOpen;
  const allowGithubEdit = !isEliminated && isEventActive;
  const teamLockMessage = isEliminated
    ? eliminationNotice?.message
    : eventError
      ? "Không thể xác nhận trạng thái sự kiện. Chức năng quản lý đội tạm thời bị khóa."
      : isEventActive
        ? "Đội hình đã được khóa khi sự kiện Active. Leader vẫn có thể cập nhật GitHub Repo để nộp bài."
      : eventStatus
        ? `Sự kiện đang ở trạng thái ${eventStatus}. Chỉ được tạo hoặc thay đổi đội trong giai đoạn Registration.`
        : "Hiện không có sự kiện ở giai đoạn Registration. Thông tin đội chỉ được xem.";
  const eliminationState = (
    <TeamEliminationOverlay
      embedded
      teamName={myTeam?.teamName}
      message={eliminationNotice?.message}
    />
  );

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0E14] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#F26F21]" />
          <p className="text-sm font-semibold tracking-wider text-slate-300 uppercase">
            Đang tải thông tin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen overflow-x-hidden"
      style={{
        background: "#F9FAFB",
        fontFamily:
          "'Montserrat', 'Inter', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        className="fixed top-0 left-[236px] right-0 h-96 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(242,111,33,0.03) 0%, transparent 100%)",
        }}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-sm transition-all duration-300 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        active={activeNav}
        onNav={(id) => {
          setActiveNav(id);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:pl-[236px]">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onNotificationsLoaded={applyNotifications}
        />

        <div className="px-8 py-5 border-b" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-end gap-3">
            <div>
              <h2
                className="text-2xl font-black tracking-tight text-[#111827]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {viewTitles[activeNav].title}
              </h2>
              <p className="text-sm text-slate-700 mt-0.5">
                {viewTitles[activeNav].sub}
              </p>
            </div>
            <div
              className="mb-1 flex-1 h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(242,111,33,0.4), transparent)",
              }}
            />
          </div>
        </div>

        <main className="flex-1 px-8 py-7">
          <div key={activeNav} className="animate-fade-in">
            {activeNav === "challenges" &&
              (isEliminated ? eliminationState : <ChallengesView />)}
            {activeNav === "submit" &&
              (isEliminated ? (
                eliminationState
              ) : (
                <SubmitView eventId={activeEventId} />
              ))}
            {activeNav === "team" && (
              <TeamView
                readOnly={teamReadOnly}
                lockMessage={teamLockMessage}
                eventEnded={eventEnded}
                allowGithubEdit={allowGithubEdit}
              />
            )}
            {activeNav === "ranking" && <RankingView />}
          </div>
        </main>

        <footer
          className="px-8 py-4 border-t flex items-center justify-between text-[11px]"
          style={{ borderColor: "#E5E7EB", color: "#4B5563" }}
        >
          <span>FPT Hackathon 2026 &mdash; All rights reserved.</span>
          <span className="font-semibold" style={{ color: "#F26F21" }}>
            FPT Hackathon 2026
          </span>
        </footer>
      </div>
    </div>
  );
}
