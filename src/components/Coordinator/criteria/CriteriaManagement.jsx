import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorProgressBar,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import eventService from "../../../services/eventService";
import trackService from "../../../services/trackService";
import roundService from "../../../services/roundService";
import criterionService from "../../../services/criterionService";
import {
  FormError,
  LoadingState,
  ApiErrorState,
  getApiMessage,
  SetupRequiredBanner,
  validateRoundSelection,
} from "../coordinatorHelpers";

const EMPTY_CRITERION = {
  name: "",
  description: "",
  maxScore: 10,
  weight: 0.1,
};

export function CriteriaManagement() {
  const [events, setEvents] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [criteria, setCriteria] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [modal, setModal] = useState(null);

  // Create template state
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateItems, setTemplateItems] = useState([]);
  const [templateFileError, setTemplateFileError] = useState("");
  const [templateWeightError, setTemplateWeightError] = useState("");
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(EMPTY_CRITERION);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    eventService
      .getAll()
      .then((res) => {
        const list = res.data?.data || [];
        setEvents(list);
        if (list.length > 0) setSelectedEventId(String(list[0].id));
      })
      .catch(() => {});
    criterionService
      .getTemplates()
      .then((res) => setTemplates(res.data?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setTracks([]);
      setSelectedTrackId("");
      return;
    }
    setTracks([]);
    setSelectedTrackId("");
    trackService
      .getByEvent(selectedEventId)
      .then((res) => {
        const list = res.data?.data || [];
        setTracks(list);
        setSelectedTrackId(list.length > 0 ? String(list[0].id) : "");
      })
      .catch(() => setTracks([]));
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedTrackId) {
      setRounds([]);
      setSelectedRoundId("");
      return;
    }
    setRounds([]);
    setSelectedRoundId("");
    roundService
      .getByTrack(selectedTrackId)
      .then((res) => {
        const list = res.data?.data || [];
        setRounds(list);
        setSelectedRoundId(list.length > 0 ? String(list[0].id) : "");
      })
      .catch(() => setRounds([]));
  }, [selectedTrackId]);

  const fetchCriteria = useCallback(async () => {
    if (!selectedRoundId) {
      setCriteria([]);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const res = await criterionService.getByRound(selectedRoundId);
      setCriteria(res.data?.data || []);
    } catch (err) {
      setApiError(getApiMessage(err, "Không thể tải tiêu chí."));
    } finally {
      setLoading(false);
    }
  }, [selectedRoundId]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const totalWeight = useMemo(
    () => criteria.reduce((sum, item) => sum + (item.weight || 0), 0),
    [criteria],
  );
  const valid = totalWeight <= 1.001;

  const roundCheck = validateRoundSelection({
    selectedEventId,
    selectedTrackId,
    selectedRoundId,
    rounds,
    tracks,
    events,
  });

  const columns = [
    { key: "name", label: "Criterion" },
    { key: "maxScore", label: "Max score" },
    { key: "weight", label: "Weight" },
    { key: "description", label: "Description" },
  ];

  const handleAddCriterion = async () => {
    const check = validateRoundSelection({
      selectedEventId,
      selectedTrackId,
      selectedRoundId,
      rounds,
      tracks,
      events,
    });
    if (!check.roundId) {
      setFormError(check.error);
      return;
    }
    if (!form.name.trim()) {
      setFormError("Tên tiêu chí không được để trống.");
      return;
    }
    setSaving(true);
    try {
      await criterionService.create(check.roundId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        maxScore: Number(form.maxScore),
        weight: Number(form.weight),
      });
      await fetchCriteria();
      setModal(null);
      setForm(EMPTY_CRITERION);
      setFormError("");
    } catch (err) {
      setFormError(getApiMessage(err, "Thêm tiêu chí thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    const check = validateRoundSelection({
      selectedEventId,
      selectedTrackId,
      selectedRoundId,
      rounds,
      tracks,
      events,
    });
    if (!check.roundId) {
      setFormError(check.error);
      return;
    }
    if (!selectedTemplateId) {
      setFormError("Chọn template để import.");
      return;
    }
    setSaving(true);
    try {
      await criterionService.importTemplate(
        check.roundId,
        Number(selectedTemplateId),
      );
      await fetchCriteria();
      setModal(null);
      setFormError("");
    } catch (err) {
      setFormError(getApiMessage(err, "Import template thất bại."));
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Parse Excel file
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTemplateFileError("");
    setTemplateWeightError("");
    setTemplateItems([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

        // Validate columns — case-insensitive match
        const required = ["name", "maxscore", "weight"];
        const rawKeys = Object.keys(rows[0] || {});
        const keysLower = rawKeys.map((k) => k.toLowerCase().trim());
        const missing = required.filter((r) => !keysLower.includes(r));
        if (missing.length) {
          // Show original expected names
          const missingDisplay = missing.map((m) =>
            m === "maxscore" ? "maxScore" : m,
          );
          setTemplateFileError(
            `File thiếu cột: ${missingDisplay.join(", ")}. Cần có: name, description, maxScore, weight`,
          );
          return;
        }
        // Build key map (original case)
        const keyMap = {};
        rawKeys.forEach((k) => {
          keyMap[k.toLowerCase().trim()] = k;
        });

        // Parse items using keyMap for case-insensitive access
        const items = rows.map((r) => ({
          name: String(r[keyMap["name"]] || "").trim(),
          description: String(r[keyMap["description"]] || "").trim(),
          maxScore: Number(r[keyMap["maxscore"]] || 10),
          weight: Number(r[keyMap["weight"]] || 0),
        }));

        // Validate name
        const emptyName = items.findIndex((it) => !it.name);
        if (emptyName >= 0) {
          setTemplateFileError(
            `Hàng ${emptyName + 2}: Cột "name" không được để trống.`,
          );
          return;
        }

        // Validate weight sum = 100
        const totalW = items.reduce((s, it) => s + it.weight, 0);
        if (Math.abs(totalW - 100) > 0.01) {
          setTemplateWeightError(
            `Tổng weight = ${totalW}. Phải đúng bằng 100.`,
          );
        }

        setTemplateItems(items);
      } catch {
        setTemplateFileError(
          "Không thể đọc file. Hãy dùng đúng định dạng .xlsx hoặc .xls.",
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      setFormError("Tên template không được để trống.");
      return;
    }
    if (!templateItems.length) {
      setFormError("Vui lòng upload file Excel trước.");
      return;
    }
    if (templateFileError) {
      setFormError(templateFileError);
      return;
    }
    const totalW = templateItems.reduce((s, it) => s + it.weight, 0);
    if (Math.abs(totalW - 100) > 0.01) {
      setFormError(`Tổng weight = ${totalW}, phải bằng 100.`);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await criterionService.createTemplate({
        name: templateName.trim(),
        description: templateDesc.trim() || null,
        items: templateItems,
      });
      // Refresh template list
      const res = await criterionService.getTemplates();
      setTemplates(res.data?.data || []);
      setModal(null);
      setTemplateName("");
      setTemplateDesc("");
      setTemplateItems([]);
      setTemplateFileError("");
      setTemplateWeightError("");
    } catch (err) {
      setFormError(getApiMessage(err, "Tạo template thất bại."));
    } finally {
      setSaving(false);
    }
  };

  // Download sample Excel
  const handleDeleteTemplate = async () => {
    if (!deleteTemplateTarget) return;
    setSaving(true);
    try {
      await criterionService.deleteTemplate(deleteTemplateTarget.id);
      const res = await criterionService.getTemplates();
      setTemplates(res.data?.data || []);
      setDeleteTemplateTarget(null);
    } catch (err) {
      setFormError(getApiMessage(err, "Xóa template thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["name", "description", "maxScore", "weight"],
      ["Tính sáng tạo", "Đánh giá ý tưởng độc đáo", 10, 30],
      ["Kỹ thuật", "Chất lượng code và kiến trúc", 10, 40],
      ["Trình bày", "Demo và thuyết trình", 10, 30],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "criterion-template-sample.xlsx");
  };

  return (
    <div className="space-y-6">
      <CoordinatorPanel
        title="Round selector"
        subtitle="Chọn vòng thi để cấu hình rubric"
        icon={icons.Filter}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.length === 0 ? (
              <option value="">Chưa có sự kiện</option>
            ) : (
              events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))
            )}
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            disabled={!tracks.length}
          >
            {tracks.length === 0 ? (
              <option value="">Chưa có Track</option>
            ) : (
              tracks.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.name}
                </option>
              ))
            )}
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            disabled={!rounds.length}
          >
            {rounds.length === 0 ? (
              <option value="">Chưa có Round — tạo ở mục Rounds</option>
            ) : (
              rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))
            )}
          </select>
        </div>
      </CoordinatorPanel>

      {roundCheck.error && (
        <SetupRequiredBanner
          title={roundCheck.error}
          hint="Thứ tự: Event → Track → Round → Criteria"
        />
      )}

      <CoordinatorPanel
        title="Weight validation"
        subtitle="Total rubric weight must be ≤ 1.0"
        icon={icons.SlidersHorizontal}
        actions={
          <>
            <CoordinatorActionButton
              icon={icons.Plus}
              onClick={() => {
                setTemplateName("");
                setTemplateDesc("");
                setTemplateItems([]);
                setTemplateFileError("");
                setTemplateWeightError("");
                setFormError("");
                setModal("createTemplate");
              }}
            >
              New Template
            </CoordinatorActionButton>
            <CoordinatorActionButton
              icon={icons.Upload}
              disabled={!roundCheck.roundId}
              onClick={() => {
                if (!roundCheck.roundId) return;
                setFormError("");
                setModal("import");
              }}
            >
              Import template
            </CoordinatorActionButton>
            <CoordinatorActionButton
              variant="primary"
              icon={icons.Plus}
              disabled={!roundCheck.roundId}
              onClick={() => {
                if (!roundCheck.roundId) return;
                setForm(EMPTY_CRITERION);
                setFormError("");
                setModal("criterion");
              }}
            >
              Add Criterion
            </CoordinatorActionButton>
          </>
        }
      >
        <div
          className={`rounded-xl border p-4 ${valid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-slate-900">
              Total weight: {totalWeight.toFixed(2)}
            </p>
            <CoordinatorBadge tone={valid ? "success" : "warning"}>
              {valid ? "Valid" : "Warning"}
            </CoordinatorBadge>
          </div>
          <CoordinatorProgressBar
            value={Math.round(totalWeight * 100)}
            color={valid ? "#059669" : "#D97706"}
          />
        </div>
      </CoordinatorPanel>

      <CoordinatorPanel
        title="Criteria table"
        subtitle="Add and review scoring rubrics (no edit/delete on BE)"
        icon={icons.Scale}
      >
        {loading ? (
          <LoadingState />
        ) : apiError ? (
          <ApiErrorState message={apiError} onRetry={fetchCriteria} />
        ) : !roundCheck.roundId ? null : criteria.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Chưa có tiêu chí cho vòng này.
          </p>
        ) : (
          <CoordinatorTable
            columns={columns}
            rows={criteria}
            renderCell={(row, key) => {
              if (key === "weight")
                return (
                  <span className="font-bold text-slate-900">
                    {Number(row.weight).toFixed(2)}
                  </span>
                );
              return row[key] ?? "—";
            }}
          />
        )}
      </CoordinatorPanel>

      {modal === "criterion" && (
        <ModalShell
          title="Add Criterion"
          onClose={() => setModal(null)}
          actions={
            <>
              <CoordinatorActionButton onClick={() => setModal(null)}>
                Cancel
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={saving}
                onClick={handleAddCriterion}
              >
                {saving ? "Saving..." : "Save"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="grid gap-3">
            <FormError msg={formError} />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <textarea
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none min-h-16"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
            <input
              type="number"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Max score"
              value={form.maxScore}
              onChange={(e) =>
                setForm((p) => ({ ...p, maxScore: e.target.value }))
              }
            />
            <input
              type="number"
              step="0.05"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Weight, e.g. 0.30"
              value={form.weight}
              onChange={(e) =>
                setForm((p) => ({ ...p, weight: e.target.value }))
              }
            />
          </div>
        </ModalShell>
      )}

      {modal === "import" && (
        <ModalShell
          title="Import criterion template"
          onClose={() => setModal(null)}
          actions={
            <>
              <CoordinatorActionButton onClick={() => setModal(null)}>
                Cancel
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={saving}
                onClick={handleImport}
              >
                {saving ? "Importing..." : "Import"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <FormError msg={formError} />
            <div className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  Chưa có template nào.
                </p>
              ) : (
                templates.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplateId(String(t.id))}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      background:
                        selectedTemplateId === String(t.id)
                          ? "rgba(242,111,33,0.08)"
                          : "#F9FAFB",
                      border: `1px solid ${selectedTemplateId === String(t.id) ? "#F26F21" : "#E5E7EB"}`,
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.items?.length ?? 0} tiêu chí •{" "}
                        {t.description || "Không có mô tả"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTemplateId === String(t.id) && (
                        <icons.CheckCircle2
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "#F26F21" }}
                        />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTemplateTarget(t);
                        }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                        style={{ color: "#9CA3AF" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(239,68,68,0.08)";
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#9CA3AF";
                        }}
                      >
                        <icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ModalShell>
      )}
      {modal === "createTemplate" && (
        <ModalShell
          title="Tạo Criterion Template"
          onClose={() => setModal(null)}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => setModal(null)}
                disabled={saving}
              >
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={saving}
                onClick={handleCreateTemplate}
              >
                {saving ? "Đang lưu..." : "Tạo Template"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-4">
            <FormError msg={formError} />

            {/* Template info */}
            <div className="space-y-2">
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Tên template *"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none min-h-14"
                placeholder="Mô tả (tuỳ chọn)"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
              />
            </div>

            {/* Instructions */}
            <div
              className="rounded-xl p-3 space-y-1.5"
              style={{
                background: "rgba(242,111,33,0.04)",
                border: "1px solid rgba(242,111,33,0.15)",
              }}
            >
              <p className="text-xs font-semibold" style={{ color: "#F26F21" }}>
                Hướng dẫn file Excel
              </p>
              <p className="text-xs text-slate-600">
                File phải có 4 cột theo đúng thứ tự:
              </p>
              <div className="rounded-lg overflow-hidden border border-slate-200 text-xs">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["name", "description", "maxScore", "weight"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-2 py-1.5 text-left font-bold text-slate-600"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderTop: "1px solid #F3F4F6" }}>
                      <td className="px-2 py-1.5 text-slate-500">
                        Tính sáng tạo
                      </td>
                      <td className="px-2 py-1.5 text-slate-500">
                        Ý tưởng độc đáo
                      </td>
                      <td className="px-2 py-1.5 text-slate-500">10</td>
                      <td className="px-2 py-1.5 text-slate-500">30</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid #F3F4F6" }}>
                      <td className="px-2 py-1.5 text-slate-500">Kỹ thuật</td>
                      <td className="px-2 py-1.5 text-slate-500">
                        Chất lượng code
                      </td>
                      <td className="px-2 py-1.5 text-slate-500">10</td>
                      <td className="px-2 py-1.5 text-slate-500">70</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                ⚠️ Tổng cột <strong>weight</strong> phải đúng bằng{" "}
                <strong>100</strong>.
              </p>
              <button
                onClick={handleDownloadSample}
                className="text-xs font-semibold flex items-center gap-1 mt-1"
                style={{ color: "#F26F21" }}
              >
                <icons.Download className="w-3 h-3" /> Tải file mẫu
              </button>
            </div>

            {/* File upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcelUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: templateItems.length
                    ? "rgba(34,197,94,0.06)"
                    : "#F9FAFB",
                  border: `1px dashed ${templateItems.length ? "#16a34a" : templateFileError ? "#ef4444" : "#D1D5DB"}`,
                  color: templateItems.length ? "#16a34a" : "#6B7280",
                }}
              >
                <icons.Upload className="w-4 h-4" />
                {templateItems.length
                  ? `✓ Đã tải ${templateItems.length} tiêu chí`
                  : "Chọn file Excel (.xlsx, .xls)"}
              </button>
              {templateFileError && (
                <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1">
                  <icons.X className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {templateFileError}
                </p>
              )}
            </div>

            {/* Weight warning */}
            {templateWeightError && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{
                  background: "rgba(234,179,8,0.08)",
                  border: "1px solid rgba(234,179,8,0.3)",
                  color: "#92400e",
                }}
              >
                <icons.SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
                {templateWeightError}
              </div>
            )}

            {/* Preview items */}
            {templateItems.length > 0 && !templateFileError && (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <div
                  className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  style={{
                    background: "#F9FAFB",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Preview ({templateItems.length} tiêu chí)
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      style={{
                        background: "#F9FAFB",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      {["Tên", "Max Score", "Weight (%)"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-semibold text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {templateItems.map((it, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom:
                            i < templateItems.length - 1
                              ? "1px solid #F3F4F6"
                              : "none",
                        }}
                      >
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {it.name}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {it.maxScore}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className="font-bold"
                            style={{
                              color:
                                Math.abs(
                                  templateItems.reduce(
                                    (s, x) => s + x.weight,
                                    0,
                                  ) - 100,
                                ) > 0.01
                                  ? "#ef4444"
                                  : "#16a34a",
                            }}
                          >
                            {it.weight}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr
                      style={{
                        background: "#F9FAFB",
                        borderTop: "1px solid #E5E7EB",
                      }}
                    >
                      <td
                        className="px-3 py-2 font-bold text-slate-700"
                        colSpan={2}
                      >
                        Tổng
                      </td>
                      <td
                        className="px-3 py-2 font-black"
                        style={{
                          color:
                            Math.abs(
                              templateItems.reduce((s, x) => s + x.weight, 0) -
                                100,
                            ) > 0.01
                              ? "#ef4444"
                              : "#16a34a",
                        }}
                      >
                        {templateItems.reduce((s, x) => s + x.weight, 0)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ModalShell>
      )}
      {deleteTemplateTarget && (
        <ModalShell
          title={`Xóa template: ${deleteTemplateTarget.name}?`}
          onClose={() => setDeleteTemplateTarget(null)}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => setDeleteTemplateTarget(null)}
                disabled={saving}
              >
                Huỷ
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="danger"
                disabled={saving}
                onClick={handleDeleteTemplate}
              >
                {saving ? "Đang xóa..." : "Xác nhận xóa"}
              </CoordinatorActionButton>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Template <strong>{deleteTemplateTarget.name}</strong> (
            {deleteTemplateTarget.items?.length ?? 0} tiêu chí) sẽ bị xóa vĩnh
            viễn.
          </p>
        </ModalShell>
      )}
    </div>
  );
}
