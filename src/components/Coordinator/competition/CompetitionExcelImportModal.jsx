import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertCircle, Download, FileSpreadsheet, Upload } from "lucide-react";
import eventService from "../../../services/eventService";
import prizeService from "../../../services/prizeService";
import LoadingActionText from "../../shared/LoadingActionText";
import { CoordinatorActionButton, ModalShell } from "../CoordinatorUI";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

const demoPdf = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
const demoBanner = "https://picsum.photos/seed/seal-hackathon-2026/1400/720";

const TEMPLATE = {
  readme: [
    ["Sheet", "Mục đích", "Trạng thái import"],
    ["Event", "Một dòng thông tin event", "Import thật"],
    ["Tracks", "Các track vòng loại và một Final Track", "Import thật"],
    ["Rounds", "Mỗi track đúng một round", "Import thật"],
    ["Topics", "Mẫu đề theo từng round thường", "Import thật sau khi tạo Round"],
    ["Prizes", "Giải thưởng hạng 1, 2, 3", "Import thật sau khi tạo event"],
    ["Teams", "Thông tin team mẫu", "Reference trước khi có API bulk phù hợp"],
    ["Members", "Thành viên mẫu", "Reference"],
    ["Submissions", "Bài nộp mẫu", "Reference"],
    ["Scores", "Điểm mẫu", "Reference"],
  ],
  event: [
    [
      "eventName",
      "descriptionHtml",
      "bannerUrl",
      "location",
      "isOnline",
      "startDate",
      "endDate",
    ],
    [
      "SEAL Innovation Hackathon 2026 - Excel Demo",
      "<h2>SEAL Innovation Hackathon 2026</h2><p>Sân chơi xây dựng sản phẩm phần mềm theo track, có mentor hỗ trợ và bảng kết quả public.</p><ul><li>3 track vòng loại</li><li>1 Final Track</li><li>Công bố top 3 chung cuộc</li></ul>",
      demoBanner,
      "FPT University HCM",
      false,
      "2026-07-10",
      "2026-07-31",
    ],
  ],
  tracks: [
    ["trackCode", "trackName", "description", "maxTeams", "minMembers", "maxMembers", "isFinal"],
    ["WEB", "Web & Cloud Solutions", "Xây dựng sản phẩm web có kiến trúc rõ ràng, triển khai ổn định và giải quyết nhu cầu thực tế.", 12, 3, 5, false],
    ["AI", "AI & Data Innovation", "Ứng dụng AI và dữ liệu để tạo ra giải pháp có thể kiểm chứng, minh bạch và hữu ích.", 12, 3, 5, false],
    ["IOT", "Smart Campus & IoT", "Tạo giải pháp số hoặc IoT giúp khuôn viên trường an toàn, tiết kiệm và thuận tiện hơn.", 12, 3, 5, false],
    ["FINAL", "Final Track", "Track chung kết nhận các đội đi tiếp từ các track vòng loại.", 15, "", "", true],
  ],
  rounds: [
    ["trackCode", "roundName", "startTime", "endTime", "advancingSlots"],
    ["WEB", "Qualifier Round - Web Product Demo", "2026-07-11T08:00", "2026-07-17T18:00", 5],
    ["AI", "Qualifier Round - AI Proof of Concept", "2026-07-11T08:00", "2026-07-17T18:00", 5],
    ["IOT", "Qualifier Round - Smart Campus Prototype", "2026-07-11T08:00", "2026-07-17T18:00", 5],
    ["FINAL", "Final Round - Event Championship", "2026-07-21T08:00", "2026-07-28T18:00", ""],
  ],
  topics: [
    ["trackCode", "roundName", "title", "description", "requirements", "attachmentUrl"],
    ["WEB", "Qualifier Round - Web Product Demo", "Campus Service Portal", "Xây dựng portal hỗ trợ sinh viên đặt lịch, gửi yêu cầu và theo dõi xử lý dịch vụ trong trường.", "Có repository GitHub, demo public, presentation public và mô tả rõ kiến trúc.", demoPdf],
    ["WEB", "Qualifier Round - Web Product Demo", "Student Marketplace", "Xây dựng marketplace nội bộ cho sinh viên mua bán giáo trình và vật dụng cá nhân.", "Có phân quyền, tìm kiếm, quản lý sản phẩm và demo luồng chính.", demoPdf],
    ["AI", "Qualifier Round - AI Proof of Concept", "AI Career Assistant", "Xây dựng proof of concept sử dụng AI để hỗ trợ định hướng nghề nghiệp.", "Có mô tả dữ liệu, cách đánh giá kết quả và giới hạn mô hình.", demoPdf],
    ["AI", "Qualifier Round - AI Proof of Concept", "Learning Risk Detection", "Nhận diện sớm nguy cơ học tập và đề xuất hỗ trợ phù hợp cho sinh viên.", "Có demo, phân tích rủi ro và giải thích quyết định của mô hình.", demoPdf],
    ["IOT", "Qualifier Round - Smart Campus Prototype", "Smart Campus Operations", "Xây dựng prototype phần mềm hoặc IoT để tối ưu một hoạt động trong khuôn viên.", "Có kiến trúc thiết bị/phần mềm, dashboard và dữ liệu mẫu.", demoPdf],
    ["IOT", "Qualifier Round - Smart Campus Prototype", "Smart Energy Monitor", "Theo dõi mức tiêu thụ năng lượng và cảnh báo bất thường trong khuôn viên.", "Có mô phỏng dữ liệu, cảnh báo và báo cáo hiệu quả.", demoPdf],
  ],
  prizes: [
    ["rankPosition", "name", "description", "amount"],
    [1, "Giải Nhất Chung Cuộc", "Đội xếp hạng 1 tại Final Round.", 50000000],
    [2, "Giải Nhì Chung Cuộc", "Đội xếp hạng 2 tại Final Round.", 30000000],
    [3, "Giải Ba Chung Cuộc", "Đội xếp hạng 3 tại Final Round.", 15000000],
  ],
  teams: [
    ["trackCode", "teamName", "university", "githubRepoLink", "leaderFullName", "leaderEmail", "leaderPhone"],
    ["WEB", "Web Nova 01", "FPT University", "https://github.com/seal-seed/web-team-01", "Nguyễn Minh Web", "web01.leader@seal.local", "0901000001"],
    ["AI", "AI Pioneer 01", "Đại học Công nghệ Thông tin", "https://github.com/seal-seed/ai-team-01", "Trần Minh AI", "ai01.leader@seal.local", "0902000001"],
    ["IOT", "Smart Campus 01", "Đại học Bách Khoa TP.HCM", "https://github.com/seal-seed/iot-team-01", "Lê Minh IoT", "iot01.leader@seal.local", "0903000001"],
  ],
  members: [
    ["teamName", "fullName", "studentCode", "email", "university", "phone", "isLeader", "isFPTStudent"],
    ["Web Nova 01", "Nguyễn Minh Web", "WEB01M1", "web01.leader@seal.local", "FPT University", "0901000001", true, true],
    ["Web Nova 01", "Thành viên 2 Web Nova", "WEB01M2", "web01.member2@seal.local", "FPT University", "0901000002", false, true],
    ["Web Nova 01", "Thành viên 3 Web Nova", "WEB01M3", "web01.member3@seal.local", "FPT University", "0901000003", false, true],
    ["AI Pioneer 01", "Trần Minh AI", "AI01M1", "ai01.leader@seal.local", "Đại học Công nghệ Thông tin", "0902000001", true, false],
  ],
  submissions: [
    ["teamName", "roundName", "presentationUrl"],
    ["Web Nova 01", "Qualifier Round - Web Product Demo", "https://example.com/presentations/web-team-01"],
    ["AI Pioneer 01", "Qualifier Round - AI Proof of Concept", "https://example.com/presentations/ai-team-01"],
  ],
  scores: [
    ["judgeEmail", "teamName", "roundName", "criterionName", "score", "comment"],
    ["judge1@gmail.com", "Web Nova 01", "Qualifier Round - Web Product Demo", "Giải pháp và tác động", 9.5, "Điểm seed demo."],
    ["judge1@gmail.com", "AI Pioneer 01", "Qualifier Round - AI Proof of Concept", "Kỹ thuật", 9.2, "Điểm seed demo."],
  ],
};

const SHEETS = {
  event: "Event",
  tracks: "Tracks",
  rounds: "Rounds",
  topics: "Topics",
  prizes: "Prizes",
  teams: "Teams",
  members: "Members",
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

function normalizeBool(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  return ["true", "1", "yes", "y", "final", "online"].includes(normalized);
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function readRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => String(cell || "").trim()),
  );
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex].map(normalizeHeader);
  return rows
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row, index) => {
      const item = { __rowNumber: headerIndex + index + 2 };
      headers.forEach((header, columnIndex) => {
        if (header) item[header] = row[columnIndex];
      });
      return item;
    });
}

function parseDateTime(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(
        Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S),
      ).toISOString();
    }
  }
  const raw = String(value || "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function getNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(String(value).replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

function requireText(row, key) {
  return String(row?.[key] || "").trim();
}

function createSheet(rows) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const maxCols = Math.max(...rows.map((row) => row.length));
  sheet["!cols"] = Array.from({ length: maxCols }, (_, index) => ({
    wch: index === 0 ? 18 : index === 1 ? 42 : 26,
  }));
  return sheet;
}

function extractCreatedEventId(response) {
  const data = response?.data?.data;
  return data?.id ?? data?.eventId ?? response?.data?.id ?? null;
}

function validateWorkbookData(data) {
  const errors = [];
  const eventRow = data.event[0];
  if (!eventRow) errors.push("Sheet Event phải có một dòng dữ liệu.");
  const eventName = requireText(eventRow, "eventname");
  const startDate = parseDateTime(eventRow?.startdate);
  const endDate = parseDateTime(eventRow?.enddate);

  if (!eventName) errors.push("Event: eventName không được để trống.");
  if (!startDate || !endDate) errors.push("Event: startDate/endDate chưa hợp lệ.");
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
    errors.push("Event: endDate phải sau startDate.");
  }

  if (!data.tracks.length) errors.push("Sheet Tracks phải có dữ liệu.");
  const trackCodes = new Set();
  data.tracks.forEach((track) => {
    const label = `Tracks dòng ${track.__rowNumber}`;
    const code = requireText(track, "trackcode");
    if (!code) errors.push(`${label}: trackCode không được để trống.`);
    if (trackCodes.has(code)) errors.push(`${label}: trackCode bị trùng.`);
    trackCodes.add(code);
    if (!requireText(track, "trackname")) errors.push(`${label}: trackName không được để trống.`);
    const maxTeams = getNumber(track.maxteams);
    const finalTrack = normalizeBool(track.isfinal);
    const hasMinMembers =
      track.minmembers !== undefined &&
      track.minmembers !== null &&
      String(track.minmembers).trim() !== "";
    const hasMaxMembers =
      track.maxmembers !== undefined &&
      track.maxmembers !== null &&
      String(track.maxmembers).trim() !== "";
    const minMembers = finalTrack ? null : getNumber(track.minmembers);
    const maxMembers = finalTrack ? null : getNumber(track.maxmembers);
    if (!Number.isInteger(maxTeams) || maxTeams < 1) errors.push(`${label}: maxTeams phải là số nguyên dương.`);
    if (finalTrack && hasMinMembers) {
      errors.push(`${label}: Final Track phải để trống minMembers.`);
    }
    if (!finalTrack && (!Number.isInteger(minMembers) || minMembers < 2)) errors.push(`${label}: minMembers phải là số nguyên từ 2 trở lên.`);
    if (finalTrack && hasMaxMembers) {
      errors.push(`${label}: Final Track phải để trống maxMembers.`);
    }
    if (!finalTrack && (!Number.isInteger(maxMembers) || maxMembers < 2)) {
      errors.push(`${label}: maxMembers phải là số nguyên từ 2 trở lên.`);
    }
    if (!finalTrack && Number.isInteger(minMembers) && Number.isInteger(maxMembers) && minMembers > maxMembers) {
      errors.push(`${label}: minMembers không được lớn hơn maxMembers.`);
    }
  });

  const finalTracks = data.tracks.filter((track) => normalizeBool(track.isfinal));
  if (finalTracks.length !== 1) errors.push("Tracks: phải có đúng một dòng isFinal = true.");

  data.rounds.forEach((round) => {
    const label = `Rounds dòng ${round.__rowNumber}`;
    const code = requireText(round, "trackcode");
    const track = data.tracks.find((item) => requireText(item, "trackcode") === code);
    if (!track) errors.push(`${label}: trackCode không tồn tại trong sheet Tracks.`);
    if (!requireText(round, "roundname")) errors.push(`${label}: roundName không được để trống.`);
    const roundStart = parseDateTime(round.starttime);
    const roundEnd = parseDateTime(round.endtime);
    if (!roundStart || !roundEnd) errors.push(`${label}: startTime/endTime chưa hợp lệ.`);
    if (roundStart && roundEnd && new Date(roundEnd) <= new Date(roundStart)) {
      errors.push(`${label}: endTime phải sau startTime.`);
    }
    if (roundStart && startDate && new Date(roundStart) < new Date(startDate)) {
      errors.push(`${label}: startTime phải nằm trong thời gian Event.`);
    }
    if (roundEnd && endDate && new Date(roundEnd) > new Date(endDate)) {
      errors.push(`${label}: endTime phải nằm trong thời gian Event.`);
    }
    if (track && !normalizeBool(track.isfinal)) {
      const slots = getNumber(round.advancingslots);
      if (!Number.isInteger(slots) || slots < 1) {
        errors.push(`${label}: advancingSlots của track vòng loại phải là số nguyên dương.`);
      }
      const maxTeams = getNumber(track.maxteams);
      if (slots > maxTeams) {
        errors.push(`${label}: advancingSlots không được vượt quá maxTeams của track.`);
      }
    }
  });

  data.tracks.forEach((track) => {
    const code = requireText(track, "trackcode");
    const rounds = data.rounds.filter((round) => requireText(round, "trackcode") === code);
    if (rounds.length !== 1) {
      errors.push(`Track ${code}: hiện tại mỗi track phải có đúng một round.`);
    }
  });

  if (!data.topics.length) {
    errors.push("Sheet Topics cần có ít nhất một đề chung cho Event.");
  }
  data.topics.forEach((topic) => {
    const label = `Topics dòng ${topic.__rowNumber}`;
    if (!requireText(topic, "title")) errors.push(`${label}: title không được để trống.`);
  });

  data.prizes.forEach((prize) => {
    const label = `Prizes dòng ${prize.__rowNumber}`;
    const rank = getNumber(prize.rankposition);
    if (!Number.isInteger(rank) || rank < 1) errors.push(`${label}: rankPosition phải là số nguyên dương.`);
    if (!requireText(prize, "name")) errors.push(`${label}: name không được để trống.`);
  });

  return errors;
}

function buildImportPayload(data) {
  const event = data.event[0];
  const firstTopic = data.topics[0];
  const tracks = data.tracks
    .map((track) => {
      const code = requireText(track, "trackcode");
      const round = data.rounds.find((item) => requireText(item, "trackcode") === code);
      const isFinal = normalizeBool(track.isfinal);
      return {
        name: requireText(track, "trackname"),
        description: requireText(track, "description") || null,
        maxTeams: Number(track.maxteams),
        minMembers: isFinal ? null : Number(track.minmembers),
        maxMembers: isFinal ? null : Number(track.maxmembers),
        isFinal,
        rounds: [
          {
            name: requireText(round, "roundname"),
            startTime: parseDateTime(round.starttime),
            endTime: parseDateTime(round.endtime),
            advancingSlots: isFinal ? null : Number(round.advancingslots),
          },
        ],
      };
    })
    .sort((left, right) => Number(left.isFinal) - Number(right.isFinal));

  return {
    eventPayload: {
      name: requireText(event, "eventname"),
      description: requireText(event, "descriptionhtml") || null,
      bannerUrl: requireText(event, "bannerurl") || null,
      location: requireText(event, "location") || null,
      isOnline: normalizeBool(event.isonline),
      startDate: parseDateTime(event.startdate),
      endDate: parseDateTime(event.enddate),
      topic: {
        name: requireText(firstTopic, "title"),
        description: requireText(firstTopic, "description") || null,
        requirements: requireText(firstTopic, "requirements") || null,
        attachmentUrl: requireText(firstTopic, "attachmenturl") || null,
      },
      tracks,
    },
    prizes: data.prizes.map((prize) => ({
      rankPosition: Number(prize.rankposition),
      name: requireText(prize, "name"),
      description: requireText(prize, "description") || null,
      amount: getNumber(prize.amount),
    })),
  };
}

export function CompetitionExcelImportModal({ onClose, onCompleted }) {
  const fileInputRef = useRef(null);
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();
    [
      ["README", TEMPLATE.readme],
      ["Event", TEMPLATE.event],
      ["Tracks", TEMPLATE.tracks],
      ["Rounds", TEMPLATE.rounds],
      ["Topics", TEMPLATE.topics],
      ["Prizes", TEMPLATE.prizes],
      ["Teams", TEMPLATE.teams],
      ["Members", TEMPLATE.members],
      ["Submissions", TEMPLATE.submissions],
      ["Scores", TEMPLATE.scores],
    ].forEach(([sheetName, rows]) => {
      XLSX.utils.book_append_sheet(workbook, createSheet(rows), sheetName);
    });
    XLSX.writeFile(workbook, "seal-event-import-template.xlsx");
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setParsedData(null);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, {
          type: "array",
          cellDates: true,
        });
        const data = {
          event: readRows(workbook, SHEETS.event),
          tracks: readRows(workbook, SHEETS.tracks),
          rounds: readRows(workbook, SHEETS.rounds),
          topics: readRows(workbook, SHEETS.topics),
          prizes: readRows(workbook, SHEETS.prizes),
          teams: readRows(workbook, SHEETS.teams),
          members: readRows(workbook, SHEETS.members),
        };
        const validationErrors = validateWorkbookData(data);
        setErrors(validationErrors);
        setParsedData(validationErrors.length ? null : data);
      } catch {
        setErrors(["Không thể đọc file Excel. Hãy dùng đúng file .xlsx hoặc .xls."]);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const submit = async () => {
    if (!parsedData || errors.length) return;
    const { eventPayload, prizes } = buildImportPayload(parsedData);

    setSaving(true);
    setProgressLabel("Đang tạo Event, Track và Round");
    try {
      const response = await eventService.createFull(eventPayload);
      const eventId = extractCreatedEventId(response);

      if (eventId && prizes.length) {
        setProgressLabel("Đang tạo cấu hình giải thưởng");
        for (const prize of prizes) {
          await prizeService.createForEvent(eventId, prize);
        }
      }

      await onCompleted?.(response.data?.data);
    } catch (error) {
      setErrors([
        error?.response?.data?.message ||
          error?.message ||
          "Không thể import file Excel.",
      ]);
    } finally {
      setSaving(false);
      setProgressLabel("");
    }
  };

  return (
    <ModalShell
      title="Import cấu trúc cuộc thi từ Excel"
      onClose={() => !saving && onClose?.()}
      maxWidthClass="max-w-5xl"
      actions={
        <>
          <CoordinatorActionButton disabled={saving} onClick={onClose}>
            Hủy
          </CoordinatorActionButton>
          <CoordinatorActionButton
            variant="primary"
            disabled={saving || !parsedData || errors.length > 0}
            onClick={submit}
          >
            {saving ? (
              <LoadingActionText>{progressLabel || "Đang import"}</LoadingActionText>
            ) : (
              "Import Excel"
            )}
          </CoordinatorActionButton>
        </>
      }
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-950">File mẫu đã có sẵn data demo</p>
              <p className="mt-1 text-sm text-slate-600">
                Mẫu gồm Event rich description, banner, 3 track vòng loại, 1 Final Track, mỗi track 1 round, topic, prize và dữ liệu team/member tham khảo.
              </p>
            </div>
            <CoordinatorActionButton onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Tải file mẫu
            </CoordinatorActionButton>
          </div>
        </section>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-6 w-6 text-orange-600" />
            Chọn file Excel để kiểm tra và import
            <span className="text-xs font-medium text-slate-700">
              Hỗ trợ .xlsx, .xls
            </span>
          </button>
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4" />
              File chưa hợp lệ
            </div>
            <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5">
              {errors.map((error, index) => (
                <li key={`${error}-${index}`}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {parsedData && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-7">
              {[
                ["Event", parsedData.event.length],
                ["Tracks", parsedData.tracks.length],
                ["Rounds", parsedData.rounds.length],
                ["Topics", parsedData.topics.length],
                ["Prizes", parsedData.prizes.length],
                ["Teams", parsedData.teams.length],
                ["Members", parsedData.members.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase text-slate-700">{label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-orange-600" />
                <p className="font-bold text-slate-950">Preview import</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Event
                  </span>
                  <input
                    readOnly
                    className={inputClass}
                    value={requireText(parsedData.event[0], "eventname")}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-slate-700">
                    Topic vòng loại
                  </span>
                  <input
                    readOnly
                    className={inputClass}
                    value={`${parsedData.topics.length} đề sẽ được tạo theo từng round thường`}
                  />
                </label>
              </div>
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                    <tr>
                      <th className="px-3 py-2">Track</th>
                      <th className="px-3 py-2">Round</th>
                      <th className="px-3 py-2">Final</th>
                      <th className="px-3 py-2">Max teams</th>
                      <th className="px-3 py-2">Min members</th>
                      <th className="px-3 py-2">Max members</th>
                      <th className="px-3 py-2">Slots</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.tracks.map((track) => {
                      const code = requireText(track, "trackcode");
                      const round = parsedData.rounds.find(
                        (item) => requireText(item, "trackcode") === code,
                      );
                      return (
                        <tr key={code}>
                          <td className="px-3 py-2 font-bold text-slate-900">
                            {requireText(track, "trackname")}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {requireText(round, "roundname")}
                          </td>
                          <td className="px-3 py-2">
                            {normalizeBool(track.isfinal) ? "Yes" : "No"}
                          </td>
                          <td className="px-3 py-2">{track.maxteams}</td>
                          <td className="px-3 py-2">
                            {normalizeBool(track.isfinal) ? "Không áp dụng" : track.minmembers}
                          </td>
                          <td className="px-3 py-2">
                            {normalizeBool(track.isfinal) ? "Không áp dụng" : track.maxmembers}
                          </td>
                          <td className="px-3 py-2">
                            {round?.advancingslots || "Final"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
