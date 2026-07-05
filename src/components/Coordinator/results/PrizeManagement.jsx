import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import prizeService from "../../../services/prizeService";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";
import { getApiMessage } from "../coordinatorHelpers";

const EMPTY_FORM = { name: "", description: "", rankPosition: "", amount: "" };
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 placeholder:text-slate-500 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

function parseDownloadName(headers, eventId) {
  const disposition = headers?.["content-disposition"] || "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^";]+)/i);
  return match?.[1]
    ? decodeURIComponent(match[1].replace(/"/g, ""))
    : `prize-winners-event-${eventId}.xlsx`;
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.prizes)) return data.prizes;
  if (Array.isArray(data?.winners)) return data.winners;
  return [];
}

export function PrizeManagement({ eventId }) {
  const [prizes, setPrizes] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) {
      setPrizes([]);
      setWinners([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [prizeResult, winnerResult] = await Promise.allSettled([
        prizeService.getByEvent(eventId),
        prizeService.getEventWinners(eventId),
      ]);

      if (prizeResult.status === "fulfilled") {
        setPrizes(normalizeList(prizeResult.value.data?.data));
      } else {
        throw prizeResult.reason;
      }

      setWinners(
        winnerResult.status === "fulfilled"
          ? normalizeList(winnerResult.value?.data?.data)
          : [],
      );
    } catch (requestError) {
      setError(
        getApiMessage(
          requestError,
          "Không thể tải cấu hình giải thưởng của sự kiện.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModal("form");
  };

  const openEdit = (prize) => {
    setEditing(prize);
    setForm({
      name: prize.name || "",
      description: prize.description || "",
      rankPosition: String(prize.rankPosition ?? ""),
      amount: prize.amount == null ? "" : String(prize.amount),
    });
    setFormError("");
    setModal("form");
  };

  const save = async () => {
    if (!eventId) return setFormError("Hãy chọn sự kiện trước khi lưu giải thưởng.");
    if (!form.name.trim()) return setFormError("Vui lòng nhập tên giải thưởng.");
    if (!Number.isInteger(Number(form.rankPosition)) || Number(form.rankPosition) < 1) {
      return setFormError("Thứ hạng phải là số nguyên dương.");
    }
    if (
      form.amount !== "" &&
      (!Number.isFinite(Number(form.amount)) || Number(form.amount) < 0)
    ) {
      return setFormError("Giá trị giải thưởng không hợp lệ.");
    }

    setSaving(true);
    setFormError("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      rankPosition: Number(form.rankPosition),
      amount: form.amount === "" ? null : Number(form.amount),
    };

    try {
      if (editing) await prizeService.update(editing.id, payload);
      else await prizeService.createForEvent(eventId, payload);
      setModal(null);
      await load();
    } catch (requestError) {
      setFormError(getApiMessage(requestError, "Không thể lưu giải thưởng."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await prizeService.remove(deleting.id);
      setDeleting(null);
      await load();
    } catch (requestError) {
      setError(getApiMessage(requestError, "Không thể xóa giải thưởng."));
    } finally {
      setSaving(false);
    }
  };

  const exportWinners = async () => {
    if (!eventId) return;
    setExporting(true);
    setError("");
    try {
      const response = await prizeService.exportEventWinners(eventId);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = parseDownloadName(response.headers, eventId);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        getApiMessage(requestError, "Không thể xuất danh sách đội đạt giải."),
      );
    } finally {
      setExporting(false);
    }
  };

  const prizeColumns = [
    { key: "rank", label: "Hạng" },
    { key: "name", label: "Giải thưởng" },
    { key: "amount", label: "Giá trị" },
    { key: "actions", label: "Thao tác" },
  ];
  const winnerColumns = [
    { key: "rank", label: "Hạng" },
    { key: "team", label: "Đội đạt giải" },
    { key: "prize", label: "Giải thưởng" },
    { key: "score", label: "Điểm" },
  ];

  return (
    <CoordinatorPanel
      title="Giải thưởng và đội chiến thắng"
      subtitle="Cấu hình giải theo Event, hệ thống tự lấy kết quả từ Final Round"
      icon={icons.Trophy}
      actions={
        <>
          <CoordinatorActionButton
            icon={icons.Download}
            disabled={!eventId || exporting}
            onClick={exportWinners}
          >
            {exporting ? "Đang xuất..." : "Xuất winners"}
          </CoordinatorActionButton>
          <CoordinatorActionButton
            variant="primary"
            icon={icons.Plus}
            disabled={!eventId}
            onClick={openCreate}
          >
            Thêm giải thưởng
          </CoordinatorActionButton>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center gap-2 py-10 text-sm text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải giải thưởng...
        </div>
      ) : (
        <div className="grid min-w-0 gap-5 2xl:grid-cols-2">
          <div className="min-w-0">
            <h4 className="mb-3 font-bold text-slate-900">
              Cấu hình giải của Event
            </h4>
            <CoordinatorTable
              columns={prizeColumns}
              rows={prizes}
              emptyMessage="Sự kiện này chưa có cấu hình giải thưởng."
              renderCell={(row, key) => {
                if (key === "rank") {
                  return <CoordinatorBadge tone="orange">#{row.rankPosition}</CoordinatorBadge>;
                }
                if (key === "amount") {
                  return row.amount == null
                    ? "—"
                    : Number(row.amount).toLocaleString("vi-VN");
                }
                if (key === "actions") {
                  return (
                    <div className="flex flex-wrap gap-2">
                      <CoordinatorActionButton
                        icon={icons.Edit3}
                        onClick={() => openEdit(row)}
                      >
                        Sửa
                      </CoordinatorActionButton>
                      <CoordinatorActionButton
                        variant="danger"
                        icon={icons.Trash2}
                        onClick={() => setDeleting(row)}
                      >
                        Xóa
                      </CoordinatorActionButton>
                    </div>
                  );
                }
                return row[key] || "—";
              }}
            />
          </div>
          <div className="min-w-0">
            <h4 className="mb-3 font-bold text-slate-900">
              Đội đạt giải của Event
            </h4>
            <CoordinatorTable
              columns={winnerColumns}
              rows={winners}
              emptyMessage={
                eventId
                  ? "Chưa có dữ liệu đội đạt giải."
                  : "Hãy chọn Event để xem đội đạt giải."
              }
              renderCell={(row, key) => {
                if (key === "rank") {
                  return <span className="font-black">#{row.rankPosition}</span>;
                }
                if (key === "team") {
                  return (
                    <div>
                      <p className="font-bold text-slate-900">{row.teamName}</p>
                      <p className="text-xs text-slate-700">{row.university}</p>
                    </div>
                  );
                }
                if (key === "prize") return row.prizeName || row.name || "—";
                if (key === "score") return Number(row.totalScore || 0).toFixed(2);
                return "—";
              }}
            />
          </div>
        </div>
      )}

      {modal === "form" && (
        <ModalShell
          title={editing ? "Chỉnh sửa giải thưởng" : "Thêm giải thưởng"}
          onClose={() => setModal(null)}
          actions={
            <>
              <CoordinatorActionButton disabled={saving} onClick={() => setModal(null)}>
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton variant="primary" disabled={saving} onClick={save}>
                {saving ? "Đang lưu..." : "Lưu giải thưởng"}
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="space-y-3">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <label className="block text-xs font-bold uppercase text-slate-600">
              Tên giải
              <input
                className={`${inputClass} mt-1`}
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, name: event.target.value }))
                }
              />
            </label>
            <label className="block text-xs font-bold uppercase text-slate-600">
              Mô tả
              <textarea
                className={`${inputClass} mt-1 min-h-20`}
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase text-slate-600">
                Thứ hạng
                <input
                  type="number"
                  min="1"
                  className={`${inputClass} mt-1`}
                  value={form.rankPosition}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      rankPosition: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-600">
                Giá trị
                <input
                  type="number"
                  min="0"
                  className={`${inputClass} mt-1`}
                  value={form.amount}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, amount: event.target.value }))
                  }
                />
              </label>
            </div>
          </div>
        </ModalShell>
      )}
      {deleting && (
        <ModalShell
          title="Xóa giải thưởng"
          onClose={() => setDeleting(null)}
          actions={
            <>
              <CoordinatorActionButton disabled={saving} onClick={() => setDeleting(null)}>
                Hủy
              </CoordinatorActionButton>
              <CoordinatorActionButton variant="danger" disabled={saving} onClick={remove}>
                {saving ? "Đang xóa..." : "Xóa"}
              </CoordinatorActionButton>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Xóa giải thưởng <strong>{deleting.name}</strong>?
          </p>
        </ModalShell>
      )}
    </CoordinatorPanel>
  );
}
