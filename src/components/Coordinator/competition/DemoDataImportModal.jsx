import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertCircle, Download, FileSpreadsheet, Upload } from "lucide-react";
import eventService from "../../../services/eventService";
import submissionService from "../../../services/submissionService";
import teamService from "../../../services/teamService";
import topicService from "../../../services/topicService";
import LoadingActionText from "../../shared/LoadingActionText";
import { CoordinatorActionButton, ModalShell } from "../CoordinatorUI";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

const modes = {
  teams: {
    title: "Import Team",
    hint: "Tạo nhanh nhiều team đã duyệt trong các track của event.",
  },
  submissions: {
    title: "Import Submission",
    hint: "Tạo nhanh bài nộp cho các team đã có trong round.",
  },
};

const teamTemplate = {
  Teams: [
    [
      "trackName",
      "teamName",
      "university",
      "githubRepoLink",
      "leaderUsername",
      "leaderEmail",
      "leaderFullName",
      "leaderStudentCode",
      "leaderPhone",
      "leaderUniversity",
      "leaderIsFPTStudent",
      "password",
    ],
    [
      "Web & Cloud Solutions",
      "Web Nova 01",
      "FPT University",
      "https://github.com/seal-demo/web-nova-01",
      "leader.web.01",
      "leader.web.01@seal.local",
      "Nguyen Van A",
      "SE180001",
      "0901000001",
      "FPT University",
      true,
      "12345",
    ],
    [
      "Web & Cloud Solutions",
      "Web Nova 02",
      "University of Science",
      "https://github.com/seal-demo/web-nova-02",
      "leader.web.02",
      "leader.web.02@seal.local",
      "Tran Van B",
      "SE180002",
      "0901000002",
      "University of Science",
      false,
      "12345",
    ],
    [
      "AI & Data Innovation",
      "AI Pioneer 01",
      "HUTECH University",
      "https://github.com/seal-demo/ai-pioneer-01",
      "leader.ai.01",
      "leader.ai.01@seal.local",
      "Le Van C",
      "SE180101",
      "0902000001",
      "HUTECH University",
      false,
      "12345",
    ],
  ],
  Members: [
    [
      "teamName",
      "fullName",
      "studentCode",
      "email",
      "university",
      "phone",
      "isFPTStudent",
    ],
    [
      "Web Nova 01",
      "Nguyen Van A2",
      "SE180011",
      "member2.web.01@seal.local",
      "FPT University",
      "0901000011",
      true,
    ],
    [
      "Web Nova 01",
      "Nguyen Van A3",
      "SE180012",
      "member3.web.01@seal.local",
      "FPT University",
      "0901000012",
      true,
    ],
    [
      "Web Nova 01",
      "Nguyen Van A4",
      "SE180013",
      "member4.web.01@seal.local",
      "FPT University",
      "0901000013",
      true,
    ],
    [
      "Web Nova 01",
      "Nguyen Van A5",
      "SE180014",
      "member5.web.01@seal.local",
      "FPT University",
      "0901000014",
      true,
    ],
    [
      "Web Nova 02",
      "Tran Van B2",
      "SE180021",
      "member2.web.02@seal.local",
      "University of Science",
      "0901000021",
      false,
    ],
    [
      "AI Pioneer 01",
      "Le Van C2",
      "SE180111",
      "member2.ai.01@seal.local",
      "HUTECH University",
      "0902000011",
      false,
    ],
  ],
  HuongDan: [
    ["Cot", "Ghi chu"],
    ["trackName", "Phai trung ten track trong event dang chon."],
    ["teamName", "Dung de ghep thanh vien va bai nop."],
    ["Members", "Moi team nen co 4 dong thanh vien; leader nam o sheet Teams."],
    ["password", "Neu bo trong, FE se gui mac dinh 12345."],
  ],
};

const submissionTemplate = {
  Submissions: [
    ["trackName", "roundName", "teamName", "topicTitle", "presentationUrl"],
    [
      "Web & Cloud Solutions",
      "Qualifier Round - Web Product Demo",
      "Web Nova 01",
      "Campus Service Portal",
      "https://docs.google.com/presentation/d/demo-web-01",
    ],
    [
      "Web & Cloud Solutions",
      "Qualifier Round - Web Product Demo",
      "Web Nova 02",
      "Campus Service Portal",
      "https://docs.google.com/presentation/d/demo-web-02",
    ],
    [
      "AI & Data Innovation",
      "Qualifier Round - AI Proof of Concept",
      "AI Pioneer 01",
      "AI Career Assistant",
      "https://docs.google.com/presentation/d/demo-ai-01",
    ],
  ],
  HuongDan: [
    ["Cot", "Ghi chu"],
    ["trackName", "Phai trung ten track trong event dang chon."],
    ["roundName", "Phai trung ten round cua track."],
    ["teamName", "Phai trung ten team da duoc tao."],
    ["topicTitle", "Phai trung ten topic da tao tay; neu bo trong FE lay topic dau tien cua round."],
    ["presentationUrl", "Link slide/presentation public."],
  ],
};

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

function asBool(value) {
  if (typeof value === "boolean") return value;
  const normalized = normalizeKey(value);
  return ["true", "1", "yes", "y", "co", "có", "fpt"].includes(normalized);
}

function asText(value) {
  return String(value ?? "").trim();
}

function getCell(row, names) {
  const aliases = Array.isArray(names) ? names : [names];
  for (const name of aliases) {
    const value = row[normalizeHeader(name)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function readSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  const headers = rows[0] || [];
  return rows
    .slice(1)
    .map((cells, index) => {
      const row = { __rowNumber: index + 2 };
      headers.forEach((header, cellIndex) => {
        row[normalizeHeader(header)] = cells[cellIndex];
      });
      return row;
    })
    .filter((row) =>
      Object.entries(row).some(
        ([key, value]) => key !== "__rowNumber" && String(value ?? "").trim(),
      ),
    );
}

function makeIndex(items, getValue) {
  const map = new Map();
  items.forEach((item) => {
    const key = normalizeKey(getValue(item));
    if (key) map.set(key, item);
  });
  return map;
}

function getTrackId(track) {
  return track?.id ?? track?.trackId;
}

function getTrackName(track) {
  return track?.name ?? track?.trackName;
}

function getRoundId(round) {
  return round?.id ?? round?.roundId;
}

function getRoundName(round) {
  return round?.name ?? round?.roundName;
}

function createWorkbook(sheets, fileName) {
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, data]) => {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(data),
      name,
    );
  });
  XLSX.writeFile(workbook, fileName);
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    "Không thể import dữ liệu."
  );
}

async function fetchApprovedTeamsByEvent(eventId, tracks) {
  const responses = await Promise.all(
    tracks.map((track) =>
      teamService.getAdminTeams({
        eventId,
        trackId: getTrackId(track),
        status: "Approved",
        pageNumber: 1,
        pageSize: 50,
      }),
    ),
  );

  return responses.flatMap((response) => unwrap(response)?.items || []);
}

export function DemoDataImportModal({ events = [], onClose, onCompleted }) {
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState("teams");
  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const selectedEvent = useMemo(
    () => events.find((event) => String(event.id) === String(eventId)),
    [events, eventId],
  );

  useEffect(() => {
    if (!eventId && events[0]?.id) {
      setEventId(events[0].id);
    }
  }, [eventId, events]);

  const canImport = Boolean(eventId && file && !saving);

  const downloadTemplate = () => {
    if (mode === "teams") {
      createWorkbook(teamTemplate, "SEAL_Team_Import_Template.xlsx");
      return;
    }
    createWorkbook(submissionTemplate, "SEAL_Submission_Import_Template.xlsx");
  };

  const readWorkbook = async () => {
    const data = await file.arrayBuffer();
    return XLSX.read(data, { type: "array", cellDates: false });
  };

  const loadEventContext = async () => {
    const [tracksResponse, roundsResponse] = await Promise.all([
      eventService.getTracks(eventId),
      eventService.getRounds(eventId),
    ]);
    const tracks = unwrap(tracksResponse) || [];
    const rounds = unwrap(roundsResponse) || [];
    return { tracks, rounds };
  };

  const importTeams = async (workbook) => {
    const teamRows = readSheet(workbook, "Teams");
    const memberRows = readSheet(workbook, "Members");
    if (!teamRows.length) {
      throw new Error("File cần có sheet Teams và ít nhất một team.");
    }

    const { tracks } = await loadEventContext();
    const trackByName = makeIndex(tracks, getTrackName);
    const membersByTeam = new Map();
    memberRows.forEach((row) => {
      const teamName = asText(getCell(row, "teamName"));
      if (!teamName) return;
      const key = normalizeKey(teamName);
      const current = membersByTeam.get(key) || [];
      current.push({
        rowNumber: row.__rowNumber,
        fullName: asText(getCell(row, "fullName")),
        studentCode: asText(getCell(row, "studentCode")),
        email: asText(getCell(row, "email")),
        university: asText(getCell(row, "university")),
        phone: asText(getCell(row, "phone")),
        isFPTStudent: asBool(getCell(row, "isFPTStudent")),
      });
      membersByTeam.set(key, current);
    });

    const teams = teamRows.map((row) => {
      const trackName = asText(getCell(row, ["trackName", "track"]));
      const track = trackByName.get(normalizeKey(trackName));
      if (!track) {
        throw new Error(`Dòng ${row.__rowNumber}: không tìm thấy track "${trackName}".`);
      }

      const teamName = asText(getCell(row, "teamName"));
      if (!teamName) {
        throw new Error(`Dòng ${row.__rowNumber}: thiếu teamName.`);
      }

      return {
        rowNumber: row.__rowNumber,
        trackId: getTrackId(track),
        teamName,
        university: asText(getCell(row, "university")),
        githubRepoLink: asText(getCell(row, "githubRepoLink")),
        leader: {
          username: asText(getCell(row, "leaderUsername")),
          email: asText(getCell(row, "leaderEmail")),
          fullName: asText(getCell(row, "leaderFullName")),
          studentCode: asText(getCell(row, "leaderStudentCode")),
          phone: asText(getCell(row, "leaderPhone")),
          university:
            asText(getCell(row, "leaderUniversity")) ||
            asText(getCell(row, "university")),
          isFPTStudent: asBool(getCell(row, "leaderIsFPTStudent")),
          password: asText(getCell(row, "password")) || "12345",
        },
        members: membersByTeam.get(normalizeKey(teamName)) || [],
      };
    });

    const response = await teamService.importTeams(eventId, {
      defaultPassword: "12345",
      defaultStatus: "Approved",
      teams,
      items: teams,
    });

    return {
      title: "Import Team hoàn tất",
      count: teams.length,
      raw: unwrap(response),
    };
  };

  const importSubmissions = async (workbook) => {
    const submissionRows = readSheet(workbook, "Submissions");
    if (!submissionRows.length) {
      throw new Error("File cần có sheet Submissions và ít nhất một bài nộp.");
    }

    const { tracks, rounds } = await loadEventContext();
    const teams = await fetchApprovedTeamsByEvent(eventId, tracks);
    const trackByName = makeIndex(tracks, getTrackName);
    const teamsByName = makeIndex(teams, (team) => team.teamName);
    const roundsByTrackAndName = new Map();
    rounds.forEach((round) => {
      roundsByTrackAndName.set(
        `${round.trackId}:${normalizeKey(getRoundName(round))}`,
        round,
      );
    });

    const topicsByRound = new Map();
    const itemsByRound = new Map();

    for (const row of submissionRows) {
      const trackName = asText(getCell(row, ["trackName", "track"]));
      const roundName = asText(getCell(row, "roundName"));
      const teamName = asText(getCell(row, "teamName"));
      const topicTitle = asText(getCell(row, "topicTitle"));
      const presentationUrl = asText(getCell(row, "presentationUrl"));

      const track = trackByName.get(normalizeKey(trackName));
      if (!track) {
        throw new Error(`Dòng ${row.__rowNumber}: không tìm thấy track "${trackName}".`);
      }
      const round = roundsByTrackAndName.get(
        `${getTrackId(track)}:${normalizeKey(roundName)}`,
      );
      if (!round) {
        throw new Error(`Dòng ${row.__rowNumber}: không tìm thấy round "${roundName}".`);
      }
      const team = teamsByName.get(normalizeKey(teamName));
      if (!team) {
        throw new Error(`Dòng ${row.__rowNumber}: không tìm thấy team "${teamName}".`);
      }
      if (!presentationUrl) {
        throw new Error(`Dòng ${row.__rowNumber}: thiếu presentationUrl.`);
      }

      const roundId = getRoundId(round);
      if (!topicsByRound.has(roundId)) {
        const response = await topicService.getByRound(roundId);
        topicsByRound.set(roundId, unwrap(response) || []);
      }
      const topics = topicsByRound.get(roundId);
      const topic =
        topics.find((item) => normalizeKey(item.title) === normalizeKey(topicTitle)) ||
        topics[0];
      if (!topic) {
        throw new Error(`Dòng ${row.__rowNumber}: round này chưa có topic.`);
      }

      const current = itemsByRound.get(roundId) || [];
      current.push({
        rowNumber: row.__rowNumber,
        teamId: team.id,
        topicId: topic.id,
        presentationUrl,
      });
      itemsByRound.set(roundId, current);
    }

    const summaries = [];
    for (const [roundId, submissions] of itemsByRound.entries()) {
      const response = await submissionService.importSubmissions(roundId, {
        submissions,
        items: submissions,
      });
      summaries.push({
        roundId,
        count: submissions.length,
        response: unwrap(response),
      });
    }

    return {
      title: "Import Submission hoàn tất",
      count: submissionRows.length,
      raw: summaries,
    };
  };

  const handleImport = async () => {
    if (!canImport) return;
    setSaving(true);
    setError("");
    setResult(null);
    try {
      const workbook = await readWorkbook();
      const summary =
        mode === "teams"
          ? await importTeams(workbook)
          : await importSubmissions(workbook);
      setResult(summary);
      onCompleted?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Import dữ liệu demo"
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      actions={
        <>
          <CoordinatorActionButton onClick={onClose} disabled={saving}>
            Đóng
          </CoordinatorActionButton>
          <CoordinatorActionButton
            variant="primary"
            onClick={handleImport}
            disabled={!canImport}
          >
            {saving ? <LoadingActionText>Đang import</LoadingActionText> : "Import"}
          </CoordinatorActionButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="mt-0.5 h-5 w-5 text-orange-600" />
            <div>
              <p className="font-semibold text-slate-950">
                Dùng cho demo nhanh sau khi đã có Event, Track, Round, Topic và Criteria.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Hệ thống sẽ đọc Excel, tự ghép dữ liệu theo event đang chọn rồi lưu hàng loạt.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(modes).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key);
                setFile(null);
                setError("");
                setResult(null);
              }}
              className={`rounded-2xl border p-4 text-left transition ${
                mode === key
                  ? "border-orange-300 bg-orange-50 text-slate-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-bold">{item.title}</p>
              <p className="mt-1 text-sm">{item.hint}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Event
            </span>
            <select
              value={eventId}
              onChange={(event) => {
                setEventId(event.target.value);
                setResult(null);
                setError("");
              }}
              className={inputClass}
              disabled={saving}
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          <CoordinatorActionButton onClick={downloadTemplate} disabled={saving}>
            <Download className="h-4 w-4" />
            Tải mẫu {mode === "teams" ? "Team" : "Submission"}
          </CoordinatorActionButton>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setError("");
              setResult(null);
            }}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">
                {file?.name || "Chưa chọn file Excel"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedEvent
                  ? `Dữ liệu sẽ được import vào ${selectedEvent.name}.`
                  : "Chọn event trước khi import."}
              </p>
            </div>
            <CoordinatorActionButton
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              <Upload className="h-4 w-4" />
              Chọn file
            </CoordinatorActionButton>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-bold text-emerald-800">{result.title}</p>
            <p className="mt-1 text-sm text-emerald-700">
              Đã xử lý {result.count} dòng dữ liệu.
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
