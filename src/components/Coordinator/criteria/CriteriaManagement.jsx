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
  FormField,
  FilterSelect,
  ModalHintBanner,
} from "../coordinatorHelpers";

const EMPTY_CRITERION = {
  name: "",
  description: "",
  maxScore: 10,
  weight: "10%",
};

const WEIGHT_TOTAL_DECIMAL = 1;

const parseWeightInput = (value) => {
  if (value === null || value === undefined) return NaN;
  const normalized = String(value).trim().replace(/%/g, "").replace(",", ".");
  if (!normalized) return NaN;
  return Number(normalized);
};

const percentToDecimal = (value) => {
  const numeric = parseWeightInput(value);
  if (!Number.isFinite(numeric)) return NaN;
  return numeric > 1 ? numeric / 100 : numeric;
};

const decimalToPercent = (value) => {
  const numeric = parseWeightInput(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric * 100;
};

const formatPercent = (value) => {
  const percent = decimalToPercent(value);
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2);
};

const normalizeCriterion = (criterion) => ({
  ...criterion,
  weight: percentToDecimal(criterion.weight),
});

const isBlankCell = (value) =>
  value === null || value === undefined || String(value).trim() === "";

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

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
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState("");
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
      setCriteria((res.data?.data || []).map(normalizeCriterion));
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
  const valid = Math.abs(totalWeight - WEIGHT_TOTAL_DECIMAL) <= 0.001;

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
    { key: "actions", label: "Actions" },
  ];

  const handleEditCriterion = async () => {
    if (!editTarget) return;
    if (!form.name.trim()) {
      setFormError("Tên tiêu chí không được để trống.");
      return;
    }
    const weight = percentToDecimal(form.weight);
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
      setFormError("Weight phải nằm trong khoảng 0% đến 100%.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await criterionService.update(selectedRoundId, editTarget.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        maxScore: Number(form.maxScore),
        weight,
      });
      await fetchCriteria();
      setModal(null);
      setEditTarget(null);
      setForm(EMPTY_CRITERION);
    } catch (err) {
      setFormError(getApiMessage(err, "Cập nhật tiêu chí thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCriterion = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setActionError("");
    try {
      await criterionService.remove(selectedRoundId, deleteTarget.id);
      await fetchCriteria();
      setDeleteTarget(null);
    } catch (err) {
      setActionError(
        getApiMessage(err, "Xóa thất bại. Có thể đã có điểm được ghi nhận."),
      );
    } finally {
      setSaving(false);
    }
  };

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
    const weight = percentToDecimal(form.weight);
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
      setFormError("Weight phải nằm trong khoảng 0% đến 100%.");
      return;
    }
    setSaving(true);
    try {
      await criterionService.create(check.roundId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        maxScore: Number(form.maxScore),
        weight,
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
        const sheetRows = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
          blankrows: false,
        });
        const headerIndex = sheetRows.findIndex((row) =>
          row.some((cell) => !isBlankCell(cell)),
        );

        if (headerIndex < 0) {
          setTemplateFileError("File Excel không có dữ liệu.");
          return;
        }

        const headers = sheetRows[headerIndex].map(normalizeHeader);
        const keyMap = headers.reduce((map, key, index) => {
          if (key) map[key] = index;
          return map;
        }, {});
        const weightColumn =
          keyMap.weight ?? keyMap.percentage ?? keyMap.percent;
        const required = [
          { key: "name", label: "name", index: keyMap.name },
          { key: "maxscore", label: "maxScore", index: keyMap.maxscore },
          { key: "weight", label: "weight/percentage", index: weightColumn },
        ];
        const missing = required
          .filter((column) => column.index === undefined)
          .map((column) => column.label);

        if (missing.length) {
          setTemplateFileError(
            `File thiếu cột: ${missing.join(", ")}. Cần có: name, description, maxScore, weight hoặc percentage`,
          );
          return;
        }

        const descriptionIndex = keyMap.description;
        const errors = [];
        const items = [];

        sheetRows.slice(headerIndex + 1).forEach((row, offset) => {
          const rowNumber = headerIndex + offset + 2;
          if (row.every((cell) => isBlankCell(cell))) return;

          const rowErrors = [];
          const name = String(row[keyMap.name] || "").trim();
          const maxScore = Number(row[keyMap.maxscore]);
          const weight = percentToDecimal(row[weightColumn]);

          if (!name) {
            rowErrors.push(
              `Dòng ${rowNumber}: cột "name" không được để trống.`,
            );
          }
          if (!Number.isFinite(maxScore) || maxScore <= 0) {
            rowErrors.push(`Dòng ${rowNumber}: cột "maxScore" phải là số > 0.`);
          }
          if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
            rowErrors.push(
              `Dòng ${rowNumber}: cột "weight/percentage" phải là 20, 20%, hoặc 0.2.`,
            );
          }

          if (rowErrors.length) {
            errors.push(...rowErrors);
            return;
          }

          items.push({
            name,
            description:
              descriptionIndex === undefined
                ? ""
                : String(row[descriptionIndex] || "").trim(),
            maxScore,
            weight,
          });
        });

        if (errors.length) {
          setTemplateFileError(errors.join(" "));
          return;
        }

        if (!items.length) {
          setTemplateFileError("File Excel không có dòng tiêu chí hợp lệ.");
          return;
        }

        const totalW = items.reduce((s, it) => s + it.weight, 0);
        if (Math.abs(totalW - WEIGHT_TOTAL_DECIMAL) > 0.001) {
          setTemplateWeightError(
            `Tổng weight = ${formatPercent(totalW)}%. File phải có tổng đúng bằng 100%.`,
          );
        }

        setTemplateItems(items);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (Math.abs(totalW - WEIGHT_TOTAL_DECIMAL) > 0.001) {
      setFormError(`Tổng weight = ${formatPercent(totalW)}%, phải bằng 100%.`);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await criterionService.createTemplate({
        name: templateName.trim(),
        description: templateDesc.trim() || null,
        items: templateItems.map((item) => ({
          ...item,
          weight: decimalToPercent(item.weight),
        })),
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
          <FilterSelect
            label="Sự kiện (Event)"
            icon={icons.CalendarDays}
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
          </FilterSelect>
          <FilterSelect
            label="Bảng thi (Track)"
            icon={icons.GitBranch}
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
          </FilterSelect>
          <FilterSelect
            label="Vòng thi (Round)"
            icon={icons.Timer}
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            disabled={!rounds.length}
          >
            {rounds.length === 0 ? (
              <option value="">Chưa có Round — tạo ở Competition Setup</option>
            ) : (
              rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))
            )}
          </FilterSelect>
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
        subtitle="Tổng weight phải đúng bằng 100%"
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
              Total weight: {formatPercent(totalWeight)}%
            </p>
            <CoordinatorBadge tone={valid ? "success" : "warning"}>
              {valid ? "Valid" : "Warning"}
            </CoordinatorBadge>
          </div>
          <CoordinatorProgressBar
            value={Math.min(100, Math.round(decimalToPercent(totalWeight)))}
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
                    {formatPercent(row.weight)}%
                  </span>
                );
              if (key === "actions")
                return (
                  <div className="flex gap-2">
                    <CoordinatorActionButton
                      icon={icons.Edit3}
                      onClick={() => {
                        setEditTarget(row);
                        setForm({
                          name: row.name,
                          description: row.description || "",
                          maxScore: row.maxScore,
                          weight: `${formatPercent(row.weight)}%`,
                        });
                        setFormError("");
                        setModal("edit");
                      }}
                    >
                      Edit
                    </CoordinatorActionButton>
                    <CoordinatorActionButton
                      variant="danger"
                      icon={icons.Trash2}
                      onClick={() => {
                        setDeleteTarget(row);
                        setActionError("");
                      }}
                    >
                      Delete
                    </CoordinatorActionButton>
                  </div>
                );
              return row[key] ?? "—";
            }}
          />
        )}
      </CoordinatorPanel>

      {modal === "criterion" && (
        <ModalShell
          title="Thêm tiêu chí chấm điểm"
          onClose={() => setModal(null)}
          actions={
            <>
              <CoordinatorActionButton onClick={() => setModal(null)}>
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={saving}
                onClick={handleAddCriterion}
              >
                {saving ? "Đang lưu..." : "Lưu tiêu chí"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="grid gap-4">
            <ModalHintBanner
              icon={icons.Scale}
              title="Tiêu chí (Criterion) là gì?"
            >
              Mỗi tiêu chí là một hạng mục Judge chấm điểm (vd: Innovation,
              Technical). Tổng <strong>Weight</strong> tất cả tiêu chí phải bằng{" "}
              <strong>100%</strong>.
            </ModalHintBanner>
            <FormError msg={formError} />
            <FormField
              label="Tên tiêu chí"
              icon={icons.Scale}
              required
              hint="VD: Innovation, Technical, Presentation"
            >
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                placeholder="Innovation"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label="Mô tả"
              icon={icons.Edit3}
              hint="Giải thích Judge cần đánh giá gì ở tiêu chí này"
            >
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none min-h-16"
                placeholder="Mức độ sáng tạo của giải pháp..."
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Điểm tối đa (Max Score)"
                icon={icons.Trophy}
                hint="Thang điểm cho tiêu chí này, thường là 10"
              >
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  placeholder="10"
                  value={form.maxScore}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxScore: e.target.value }))
                  }
                />
              </FormField>
              <FormField
                label="Trọng số (Weight)"
                icon={icons.SlidersHorizontal}
                hint="Nhập 20 hoặc 20% (gửi BE là 0.2). Tổng tất cả tiêu chí = 100%"
              >
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  placeholder="20%"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, weight: e.target.value }))
                  }
                />
              </FormField>
            </div>
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
                File cần có cột name, maxScore và weight hoặc percentage.
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
                ⚠️ Tổng cột <strong>weight/percentage</strong> phải đúng bằng{" "}
                <strong>100%</strong>. Chấp nhận 20, 20%, hoặc 0.2.
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
                                  ) - WEIGHT_TOTAL_DECIMAL,
                                ) > 0.001
                                  ? "#ef4444"
                                  : "#16a34a",
                            }}
                          >
                            {formatPercent(it.weight)}%
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
                                WEIGHT_TOTAL_DECIMAL,
                            ) > 0.001
                              ? "#ef4444"
                              : "#16a34a",
                        }}
                      >
                        {`${formatPercent(
                          templateItems.reduce((s, x) => s + x.weight, 0),
                        )}%`}
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
      {/* Action error */}
      {actionError && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#dc2626",
          }}
        >
          <icons.X className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* Modal: Edit Criterion */}
      {modal === "edit" && editTarget && (
        <ModalShell
          title={`Sửa tiêu chí: ${editTarget.name}`}
          onClose={() => {
            setModal(null);
            setEditTarget(null);
          }}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => {
                  setModal(null);
                  setEditTarget(null);
                }}
                disabled={saving}
              >
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                disabled={saving}
                onClick={handleEditCriterion}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="grid gap-3">
            <FormError msg={formError} />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Tên tiêu chí *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <textarea
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none min-h-16"
              placeholder="Mô tả"
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
              type="text"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
              placeholder="Weight, e.g. 20 or 20%"
              value={form.weight}
              onChange={(e) =>
                setForm((p) => ({ ...p, weight: e.target.value }))
              }
            />
          </div>
        </ModalShell>
      )}

      {/* Modal: Delete Criterion */}
      {deleteTarget && (
        <ModalShell
          title={`Xóa tiêu chí: ${deleteTarget.name}?`}
          onClose={() => {
            setDeleteTarget(null);
            setActionError("");
          }}
          actions={
            <>
              <CoordinatorActionButton
                onClick={() => {
                  setDeleteTarget(null);
                  setActionError("");
                }}
                disabled={saving}
              >
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="danger"
                disabled={saving}
                onClick={handleDeleteCriterion}
              >
                {saving ? "Đang xóa..." : "Xác nhận xóa"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Tiêu chí <strong>{deleteTarget.name}</strong> sẽ bị xóa vĩnh viễn.
              Chỉ xóa được nếu chưa có điểm nào được ghi nhận.
            </p>
            {actionError && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#dc2626",
                }}
              >
                <icons.X className="w-4 h-4 flex-shrink-0" />
                {actionError}
              </div>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}
