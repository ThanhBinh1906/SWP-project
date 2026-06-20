import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Loader2 } from "lucide-react";
import eventService from "../../../services/eventService";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  ModalShell,
} from "../CoordinatorUI";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function getCreatedId(response, keys) {
  const data = response?.data?.data ?? response?.data;
  if (typeof data === "number" || typeof data === "string") return data;
  for (const key of keys) {
    if (data?.[key] !== undefined && data?.[key] !== null) return data[key];
  }
  return null;
}

function toDate(value) {
  return value?.slice(0, 10) || "";
}

function toDateTime(value) {
  return value?.slice(0, 16) || "";
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export function CloneCompetitionModal({ sourceEvent, onClose, onCompleted }) {
  const [eventForm, setEventForm] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [createdEventId, setCreatedEventId] = useState(null);
  const [createdTrackIds, setCreatedTrackIds] = useState({});
  const [createdRoundKeys, setCreatedRoundKeys] = useState([]);
  const [progressLabel, setProgressLabel] = useState("");

  const createdRoundSet = useMemo(
    () => new Set(createdRoundKeys),
    [createdRoundKeys],
  );

  const loadStructure = async () => {
    setLoading(true);
    setError("");
    try {
      const [tracksResponse, roundsResponse] = await Promise.all([
        eventService.getTracks(sourceEvent.id),
        eventService.getTracksRounds(),
      ]);
      const eventTracks = tracksResponse.data?.data || [];
      const allTrackRounds = roundsResponse.data?.data || [];

      setEventForm({
        name: `${sourceEvent.name} - Bản sao`,
        description: sourceEvent.description || "",
        startDate: toDate(sourceEvent.startDate),
        endDate: toDate(sourceEvent.endDate),
      });
      setTracks(
        eventTracks.map((track, trackIndex) => {
          const roundGroup = allTrackRounds.find(
            (item) => String(item.trackId) === String(track.id),
          );
          return {
            key: `track-${track.id ?? trackIndex}`,
            sourceId: track.id,
            name: track.name || "",
            description: track.description || "",
            maxTeams: String(track.maxTeams ?? ""),
            rounds: (roundGroup?.rounds || []).map((round, roundIndex) => ({
              key: `round-${track.id ?? trackIndex}-${round.roundId ?? roundIndex}`,
              name: round.name || "",
              startTime: toDateTime(round.startTime),
              endTime: toDateTime(round.endTime),
              advancingSlots: String(round.advancingSlots ?? ""),
            })),
          };
        }),
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Không thể tải đầy đủ Track và Round của sự kiện này.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructure();
    // sourceEvent is fixed for the lifetime of this modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceEvent.id]);

  const changeEvent = (field, value) => {
    setEventForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  };

  const changeTrack = (trackKey, field, value) => {
    setTracks((previous) =>
      previous.map((track) =>
        track.key === trackKey ? { ...track, [field]: value } : track,
      ),
    );
    setError("");
  };

  const changeRound = (trackKey, roundKey, field, value) => {
    setTracks((previous) =>
      previous.map((track) =>
        track.key !== trackKey
          ? track
          : {
              ...track,
              rounds: track.rounds.map((round) =>
                round.key === roundKey ? { ...round, [field]: value } : round,
              ),
            },
      ),
    );
    setError("");
  };

  const validate = () => {
    if (!eventForm?.name.trim()) return "Tên Event mới không được để trống.";
    if (!eventForm.startDate || !eventForm.endDate)
      return "Vui lòng chọn đầy đủ thời gian của Event mới.";
    if (eventForm.endDate < eventForm.startDate)
      return "Ngày kết thúc Event phải sau ngày bắt đầu.";

    for (const track of tracks) {
      if (!track.name.trim()) return "Tên Track không được để trống.";
      if (!Number.isInteger(Number(track.maxTeams)) || Number(track.maxTeams) < 1)
        return `Số team tối đa của Track "${track.name}" phải là số nguyên dương.`;

      for (const round of track.rounds) {
        if (!round.name.trim()) return `Có Round trong Track "${track.name}" chưa có tên.`;
        if (!round.startTime || !round.endTime)
          return `Round "${round.name}" chưa có đầy đủ thời gian.`;
        if (round.endTime <= round.startTime)
          return `Thời gian kết thúc của Round "${round.name}" không hợp lệ.`;
        if (
          round.startTime.slice(0, 10) < eventForm.startDate ||
          round.endTime.slice(0, 10) > eventForm.endDate
        )
          return `Round "${round.name}" phải nằm trong thời gian của Event mới.`;
        if (
          !Number.isInteger(Number(round.advancingSlots)) ||
          Number(round.advancingSlots) < 1
        )
          return `Số suất đi tiếp của Round "${round.name}" phải là số nguyên dương.`;
        if (Number(round.advancingSlots) > Number(track.maxTeams))
          return `Số suất đi tiếp của Round "${round.name}" vượt quá số team tối đa.`;
      }
    }
    return "";
  };

  const saveClone = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    let newEventId = createdEventId;
    const trackIdMap = { ...createdTrackIds };
    const finishedRounds = new Set(createdRoundKeys);

    try {
      if (!newEventId) {
        setProgressLabel("Đang tạo Event mới...");
        const eventResponse = await eventService.create({
          name: eventForm.name.trim(),
          description: eventForm.description.trim(),
          startDate: eventForm.startDate,
          endDate: eventForm.endDate,
          status: "Registration",
        });
        newEventId = getCreatedId(eventResponse, ["id", "eventId"]);
        if (!newEventId) throw new Error("API tạo Event không trả về eventId.");
        setCreatedEventId(newEventId);
      }

      for (const track of tracks) {
        let newTrackId = trackIdMap[track.key];
        if (!newTrackId) {
          setProgressLabel(`Đang tạo Track: ${track.name}`);
          const trackResponse = await eventService.createTrack({
            eventId: Number(newEventId),
            name: track.name.trim(),
            description: track.description.trim(),
            maxTeams: Number(track.maxTeams),
          });
          newTrackId = getCreatedId(trackResponse, ["id", "trackId"]);
          if (!newTrackId)
            throw new Error(`API không trả về trackId cho Track "${track.name}".`);
          trackIdMap[track.key] = newTrackId;
          setCreatedTrackIds({ ...trackIdMap });
        }

        for (const round of track.rounds) {
          if (finishedRounds.has(round.key)) continue;
          setProgressLabel(`Đang tạo Round: ${round.name}`);
          await eventService.createRound({
            trackId: Number(newTrackId),
            name: round.name.trim(),
            startTime: new Date(round.startTime).toISOString(),
            endTime: new Date(round.endTime).toISOString(),
            advancingSlots: Number(round.advancingSlots),
          });
          finishedRounds.add(round.key);
          setCreatedRoundKeys([...finishedRounds]);
        }
      }

      setCompleted(true);
      setProgressLabel("");
      await onCompleted?.({ eventId: newEventId });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Không thể hoàn tất bản sao. Hãy kiểm tra và thử lại từ bước lỗi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    if (!saving) onClose?.({ hasPartialData: Boolean(createdEventId) && !completed });
  };

  return (
    <ModalShell
      title={`Sao chép: ${sourceEvent.name}`}
      onClose={close}
      maxWidthClass="max-w-7xl"
      maxHeightClass="max-h-[92vh]"
      actions={
        <>
          <CoordinatorActionButton onClick={close} disabled={saving}>
            {completed ? "Đóng" : "Hủy"}
          </CoordinatorActionButton>
          {!completed && (
            <CoordinatorActionButton
              variant="primary"
              icon={saving ? undefined : Copy}
              onClick={saveClone}
              disabled={loading || saving || !eventForm}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? progressLabel : createdEventId ? "Tiếp tục tạo bản sao" : "Tạo bản sao"}
            </CoordinatorActionButton>
          )}
        </>
      }
    >
      <div className="space-y-5 pb-2">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            Đang tải cấu trúc Event...
          </div>
        ) : (
          <>
            {error && (
              <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {completed && (
              <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                Đã sao chép toàn bộ Event, Track và Round thành công.
              </div>
            )}
            {createdEventId && !completed && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                Một phần bản sao đã được tạo. Các dòng hoàn tất được khóa; lần lưu tiếp theo tiếp tục từ vị trí bị lỗi.
              </div>
            )}

            {eventForm && (
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900">Thông tin Event mới</h4>
                    <p className="text-xs text-slate-500">Bản sao luôn bắt đầu ở trạng thái Registration.</p>
                  </div>
                  <CoordinatorBadge tone="orange">Registration</CoordinatorBadge>
                </div>
                <div className="grid gap-3 lg:grid-cols-[1.25fr_1.75fr_0.8fr_0.8fr]">
                  <Field label="Tên Event">
                    <input className={inputClass} disabled={Boolean(createdEventId)} value={eventForm.name} onChange={(event) => changeEvent("name", event.target.value)} />
                  </Field>
                  <Field label="Mô tả">
                    <input className={inputClass} disabled={Boolean(createdEventId)} value={eventForm.description} onChange={(event) => changeEvent("description", event.target.value)} />
                  </Field>
                  <Field label="Bắt đầu">
                    <input type="date" className={inputClass} disabled={Boolean(createdEventId)} value={eventForm.startDate} onChange={(event) => changeEvent("startDate", event.target.value)} />
                  </Field>
                  <Field label="Kết thúc">
                    <input type="date" className={inputClass} disabled={Boolean(createdEventId)} value={eventForm.endDate} onChange={(event) => changeEvent("endDate", event.target.value)} />
                  </Field>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                <div>
                  <h4 className="font-bold text-slate-900">Cấu trúc Track và Round</h4>
                  <p className="text-xs text-slate-500">Chỉnh trực tiếp các ô trước khi tạo bản sao.</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {tracks.length} Track · {tracks.reduce((sum, track) => sum + track.rounds.length, 0)} Round
                </span>
              </div>

              {tracks.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Event gốc chưa có Track. Bản sao sẽ chỉ tạo thông tin Event.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {tracks.map((track, trackIndex) => {
                    const trackDone = Boolean(createdTrackIds[track.key]);
                    return (
                      <div key={track.key} className="bg-white p-4">
                        <div className="mb-3 grid gap-3 lg:grid-cols-[56px_1.1fr_1.5fr_150px] lg:items-end">
                          <div className="hidden h-10 items-center justify-center rounded-lg bg-orange-50 text-sm font-bold text-orange-700 lg:flex">
                            T{trackIndex + 1}
                          </div>
                          <Field label="Tên Track">
                            <input className={inputClass} disabled={trackDone} value={track.name} onChange={(event) => changeTrack(track.key, "name", event.target.value)} />
                          </Field>
                          <Field label="Mô tả Track">
                            <input className={inputClass} disabled={trackDone} value={track.description} onChange={(event) => changeTrack(track.key, "description", event.target.value)} />
                          </Field>
                          <Field label="Team tối đa">
                            <input type="number" min="1" step="1" className={inputClass} disabled={trackDone} value={track.maxTeams} onChange={(event) => changeTrack(track.key, "maxTeams", event.target.value)} />
                          </Field>
                        </div>

                        {track.rounds.length === 0 ? (
                          <div className="ml-0 rounded-lg border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500 lg:ml-[68px]">
                            Track này chưa có Round.
                          </div>
                        ) : (
                          <div className="overflow-x-auto lg:ml-[68px]">
                            <table className="min-w-[850px] w-full table-fixed text-left text-sm">
                              <thead>
                                <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                  <th className="w-[26%] px-3 py-2">Round</th>
                                  <th className="w-[24%] px-3 py-2">Bắt đầu</th>
                                  <th className="w-[24%] px-3 py-2">Kết thúc</th>
                                  <th className="w-[14%] px-3 py-2">Suất đi tiếp</th>
                                  <th className="w-[12%] px-3 py-2">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {track.rounds.map((round) => {
                                  const roundDone = createdRoundSet.has(round.key);
                                  return (
                                    <tr key={round.key} className={roundDone ? "bg-emerald-50/40" : "bg-white"}>
                                      <td className="p-2"><input className={inputClass} disabled={roundDone} value={round.name} onChange={(event) => changeRound(track.key, round.key, "name", event.target.value)} /></td>
                                      <td className="p-2"><input type="datetime-local" className={inputClass} disabled={roundDone} value={round.startTime} onChange={(event) => changeRound(track.key, round.key, "startTime", event.target.value)} /></td>
                                      <td className="p-2"><input type="datetime-local" className={inputClass} disabled={roundDone} value={round.endTime} onChange={(event) => changeRound(track.key, round.key, "endTime", event.target.value)} /></td>
                                      <td className="p-2"><input type="number" min="1" step="1" className={inputClass} disabled={roundDone} value={round.advancingSlots} onChange={(event) => changeRound(track.key, round.key, "advancingSlots", event.target.value)} /></td>
                                      <td className="p-2"><CoordinatorBadge tone={roundDone ? "success" : "neutral"}>{roundDone ? "Đã tạo" : "Upcoming"}</CoordinatorBadge></td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </ModalShell>
  );
}
