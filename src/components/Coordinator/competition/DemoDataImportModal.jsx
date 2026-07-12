import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertCircle, Download, FileSpreadsheet, Upload } from "lucide-react";
import eventService from "../../../services/eventService";
import submissionService from "../../../services/submissionService";
import teamService from "../../../services/teamService";
import topicService from "../../../services/topicService";
import trackService from "../../../services/trackService";
import LoadingActionText from "../../shared/LoadingActionText";
import { CoordinatorActionButton, ModalShell } from "../CoordinatorUI";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

const modes = {
  teams: {
    title: "Import Team",
    hint: "Tạo nhanh nhiều team trong các track của event.",
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
      "username",
      "university",
      "phone",
      "isFPTStudent",
    ],
    [
      "Web Nova 01",
      "Nguyen Van A2",
      "SE180011",
      "member2.web.01@seal.local",
      "member2.web.01",
      "FPT University",
      "0901000011",
      true,
    ],
    [
      "Web Nova 01",
      "Nguyen Van A3",
      "SE180012",
      "member3.web.01@seal.local",
      "member3.web.01",
      "FPT University",
      "0901000012",
      true,
    ],
    [
      "Web Nova 01",
      "Nguyen Van A4",
      "SE180013",
      "member4.web.01@seal.local",
      "member4.web.01",
      "FPT University",
      "0901000013",
      true,
    ],
    [
      "Web Nova 01",
      "Nguyen Van A5",
      "SE180014",
      "member5.web.01@seal.local",
      "member5.web.01",
      "FPT University",
      "0901000014",
      true,
    ],
    [
      "Web Nova 02",
      "Tran Van B2",
      "SE180021",
      "member2.web.02@seal.local",
      "member2.web.02",
      "University of Science",
      "0901000021",
      false,
    ],
    [
      "AI Pioneer 01",
      "Le Van C2",
      "SE180111",
      "member2.ai.01@seal.local",
      "member2.ai.01",
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
      ["username", "Bat buoc de tao tai khoan thanh vien."],
      ["password", "Neu bo trong, FE se gui mac dinh 12345."],
  ],
};

const teamTemplateHeader = teamTemplate.Teams[0];
const memberTemplateHeader = teamTemplate.Members[0];

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

const submissionTemplateHeader = submissionTemplate.Submissions[0];

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

function getTrackCurrentTeamCount(track) {
  return (
    track?.currentTeamCount ??
    track?.currentTeams ??
    track?.teamCount ??
    track?.registeredTeamCount ??
    0
  );
}

function getTrackMaxTeams(track) {
  const value = Number(track?.maxTeams || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getTrackMaxMembers(track) {
  const value = Number(track?.maxMembers || 5);
  return Number.isFinite(value) && value > 0 ? value : 5;
}

function getTeamTrackId(team) {
  return team?.trackId ?? team?.track?.id;
}

function isFinalTrack(track) {
  const name = normalizeKey(getTrackName(track));
  return Boolean(track?.isFinal || track?.isFinalTrack) || name.includes("final");
}

function slugify(value) {
  return String(value || "track")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "track";
}

function padNumber(value, size = 2) {
  return String(value).padStart(size, "0");
}

function createImportBatchCode() {
  return Date.now().toString(36).slice(-5);
}

function buildTeamTemplateFromTracks({ eventId, tracks }) {
  const batchCode = createImportBatchCode();
  const batchCodeUpper = batchCode.toUpperCase();
  const normalTracks = tracks.filter((track) => !isFinalTrack(track));
  const targetTracks = normalTracks.length ? normalTracks : tracks;
  const teamRows = [teamTemplateHeader];
  const memberRows = [memberTemplateHeader];
  const guideRows = [
    ["Cot", "Ghi chu"],
    ["trackName", "Duoc tao tu event dang chon, khong nen doi neu khong can."],
    ["teamName", "Moi team co leader o sheet Teams va thanh vien o sheet Members."],
    ["studentCode/email/username", `Da kem ma import ${batchCodeUpper} de tranh trung voi event cu.`],
    ["Final Track", "File mau khong tao team vao Final Track de giu dung flow vao vong trong."],
  ];

  targetTracks.forEach((track) => {
    const trackId = getTrackId(track);
    const trackName = getTrackName(track);
    const maxTeams = getTrackMaxTeams(track);
    const currentTeams = getTrackCurrentTeamCount(track);
    const remainingTeams = Math.max(maxTeams - currentTeams, 0);
    const memberCount = Math.max(2, Math.min(getTrackMaxMembers(track) - 1, 4));
    const slug = slugify(trackName);
    const accountSlug = slug.replace(/-/g, "_");

    for (let index = 1; index <= remainingTeams; index += 1) {
      const sequence = currentTeams + index;
      const teamCode = `E${eventId}T${trackId}N${padNumber(sequence)}`;
      const sequenceText = padNumber(sequence);
      const teamName = `${trackName} Team ${sequenceText} - ${batchCodeUpper}`;
      const leaderKey = `leader_${eventId}_${accountSlug}_${sequenceText}_${batchCode}`;
      const leaderEmail = `leader.e${eventId}.${slug}.t${sequenceText}.${batchCode}@seal.local`;
      const university =
        index % 3 === 0
          ? "HUTECH University"
          : index % 2 === 0
            ? "University of Science"
            : "FPT University";

      teamRows.push([
        trackName,
        teamName,
        university,
        `https://github.com/seal-demo/${slug}-team-${sequenceText}-${batchCode}`,
        leaderKey,
        leaderEmail,
        `Leader ${trackName} ${sequenceText}`,
        `${teamCode}M1${batchCodeUpper}`,
        `09${padNumber(trackId, 2)}${padNumber(sequence, 2)}0001`,
        university,
        university === "FPT University",
        "12345",
      ]);

      for (let memberIndex = 2; memberIndex <= memberCount + 1; memberIndex += 1) {
        const memberKey = `member_${eventId}_${accountSlug}_${sequenceText}_m${memberIndex}_${batchCode}`;
        memberRows.push([
          teamName,
          `Thanh vien ${memberIndex} - ${teamName}`,
          `${teamCode}M${memberIndex}${batchCodeUpper}`,
          `member.e${eventId}.${slug}.t${sequenceText}.m${memberIndex}.${batchCode}@seal.local`,
          memberKey,
          university,
          `09${padNumber(trackId, 2)}${padNumber(sequence, 2)}000${memberIndex}`,
          university === "FPT University",
        ]);
      }
    }
  });

  if (teamRows.length === 1) {
    guideRows.push([
      "Khong co slot trong",
      "Tat ca track thuong cua event dang chon da du so doi theo maxTeams.",
    ]);
  }

  return {
    Teams: teamRows,
    Members: memberRows,
    HuongDan: guideRows,
  };
}

function getRoundId(round) {
  return round?.id ?? round?.roundId;
}

function getRoundName(round) {
  return round?.name ?? round?.roundName;
}

function buildSubmissionTemplateFromContext({
  tracks,
  rounds,
  teams,
  topicsByRound,
}) {
  const submissionRows = [submissionTemplateHeader];
  const guideRows = [
    ["Cot", "Ghi chu"],
    ["trackName", "Duoc lay tu event dang chon."],
    ["roundName", "Duoc lay tu round cua track tuong ung."],
    ["teamName", "Phai giu nguyen ten team da tao trong event."],
    ["topicTitle", "Neu round co topic, file mau se dien topic dau tien."],
    ["presentationUrl", "Thay bang link slide/presentation public cua team."],
  ];

  const normalTracks = tracks.filter((track) => !isFinalTrack(track));
  const trackById = new Map(
    normalTracks.map((track) => [String(getTrackId(track)), track]),
  );
  const roundByTrackId = new Map();
  rounds.forEach((round) => {
    const trackId = String(round.trackId ?? round.track?.id ?? "");
    if (trackId && !roundByTrackId.has(trackId)) {
      roundByTrackId.set(trackId, round);
    }
  });

  teams.forEach((team, index) => {
    const trackId = String(getTeamTrackId(team) || "");
    const track = trackById.get(trackId);
    const round = roundByTrackId.get(trackId);
    if (!track || !round) return;

    const roundId = getRoundId(round);
    const topics = topicsByRound.get(String(roundId)) || [];
    const topic = topics[0];
    const teamName = team.teamName || team.name || `Team ${index + 1}`;

    submissionRows.push([
      getTrackName(track),
      getRoundName(round),
      teamName,
      topic?.title || "",
      `https://docs.google.com/presentation/d/demo-${slugify(teamName)}`,
    ]);
  });

  if (submissionRows.length === 1) {
    guideRows.push([
      "Chua co du lieu",
      "Can co team Approved trong event va round cua track truoc khi tao mau submission.",
    ]);
  }

  return {
    Submissions: submissionRows,
    HuongDan: guideRows,
  };
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

function normalizeImportResult(raw, fallbackCount) {
  const data = raw?.data || raw || {};
  return {
    created: Array.isArray(data.created) ? data.created : [],
    failed: Array.isArray(data.failed) ? data.failed : [],
    fallbackCount,
  };
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
  const [teamImportStatus, setTeamImportStatus] = useState("Pending");
  const [saving, setSaving] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
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

  const downloadTemplate = async () => {
    setError("");
    setTemplateLoading(true);
    try {
      if (mode === "teams") {
        const { tracks } = await loadEventContext();
        createWorkbook(
          buildTeamTemplateFromTracks({ eventId, tracks }),
          "SEAL_Team_Import_Template.xlsx",
        );
        return;
      }
      const { tracks, rounds } = await loadEventContext();
      const teams = await fetchApprovedTeamsByEvent(eventId, tracks);
      const topicsByRound = new Map();
      await Promise.all(
        rounds.map(async (round) => {
          const roundId = getRoundId(round);
          if (!roundId) return;
          const response = await topicService.getByRound(roundId);
          topicsByRound.set(String(roundId), unwrap(response) || []);
        }),
      );
      createWorkbook(
        buildSubmissionTemplateFromContext({
          tracks,
          rounds,
          teams,
          topicsByRound,
        }),
        "SEAL_Submission_Import_Template.xlsx",
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTemplateLoading(false);
    }
  };

  const readWorkbook = async () => {
    const data = await file.arrayBuffer();
    return XLSX.read(data, { type: "array", cellDates: false });
  };

  const loadEventContext = async () => {
    const [tracksResponse, roundsResponse] = await Promise.all([
      trackService.getByEvent(eventId),
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
        username: asText(getCell(row, "username")),
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
      defaultStatus: teamImportStatus,
      teams,
      items: teams,
    });
    const raw = unwrap(response);

    return {
      title: "Import Team hoàn tất",
      count: teams.length,
      ...normalizeImportResult(raw, teams.length),
      raw,
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
      if (isFinalTrack(track)) {
        throw new Error(`Dòng ${row.__rowNumber}: Final Round không import submission thủ công.`);
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
      const topic = topicTitle
        ? topics.find((item) => normalizeKey(item.title) === normalizeKey(topicTitle))
        : topics[0];
      if (!topic) {
        throw new Error(
          topicTitle
            ? `Dòng ${row.__rowNumber}: topic "${topicTitle}" không thuộc round "${roundName}".`
            : `Dòng ${row.__rowNumber}: round này chưa có topic.`,
        );
      }
      if (topic.roundId && String(topic.roundId) !== String(roundId)) {
        throw new Error(`Dòng ${row.__rowNumber}: topic không thuộc round "${roundName}".`);
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
        autoCreateRoundTeam: true,
        submissions,
        items: submissions,
      });
      const raw = unwrap(response);
      summaries.push({
        roundId,
        count: submissions.length,
        ...normalizeImportResult(raw, submissions.length),
        response: raw,
      });
    }

    const created = summaries.flatMap((summary) => summary.created);
    const failed = summaries.flatMap((summary) => summary.failed);

    return {
      title: "Import Submission hoàn tất",
      count: submissionRows.length,
      created,
      failed,
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

          <CoordinatorActionButton
            onClick={downloadTemplate}
            disabled={saving || templateLoading || !eventId}
          >
            <Download className="h-4 w-4" />
            {templateLoading ? (
              <LoadingActionText>Đang tạo mẫu</LoadingActionText>
            ) : (
              <>Tải mẫu {mode === "teams" ? "Team" : "Submission"}</>
            )}
          </CoordinatorActionButton>
        </div>

        {mode === "teams" && (
          <label className="block space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Trạng thái team sau khi import
            </span>
            <select
              value={teamImportStatus}
              onChange={(event) => setTeamImportStatus(event.target.value)}
              className={inputClass}
              disabled={saving}
            >
              <option value="Pending">Pending - chưa chặn kích hoạt Event</option>
              <option value="Approved">
                Approved - chỉ dùng khi team đã có Mentor
              </option>
            </select>
            <p className="text-sm text-slate-600">
              Event không thể Active nếu còn team Approved chưa được gán Mentor.
            </p>
          </label>
        )}

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
          <div
            className={`rounded-2xl border p-4 ${
              result.failed?.length
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <p
              className={`font-bold ${
                result.failed?.length ? "text-amber-800" : "text-emerald-800"
              }`}
            >
              {result.title}
            </p>
            <p
              className={`mt-1 text-sm ${
                result.failed?.length ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              Thành công {result.created?.length || 0} dòng, lỗi{" "}
              {result.failed?.length || 0} dòng.
            </p>
            {result.failed?.length > 0 && (
              <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-amber-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-700">
                    <tr>
                      <th className="px-3 py-2">Dòng</th>
                      <th className="px-3 py-2">Lý do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 text-slate-800">
                    {result.failed.map((item, index) => (
                      <tr key={`${item.rowNumber || "row"}-${index}`}>
                        <td className="w-20 px-3 py-2 font-semibold">
                          {item.rowNumber || "-"}
                        </td>
                        <td className="px-3 py-2">{item.reason || "Không rõ lỗi."}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
