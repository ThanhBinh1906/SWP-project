import { useState } from "react";
import { AlertCircle, FileText, GitBranch, Plus, Trash2, Upload } from "lucide-react";
import eventService from "../../../services/eventService";
import { uploadTopicPdf, validateTopicPdf } from "../../../services/cloudinaryService";
import LoadingActionText from "../../shared/LoadingActionText";
import { CoordinatorActionButton, ModalShell } from "../CoordinatorUI";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
const newTopic = () => ({ name: "", description: "", requirements: "", attachmentUrl: "", file: null });
const newRound = () => ({ name: "", startTime: "", endTime: "", advancingSlots: "", topics: [] });
const newTrack = () => ({ name: "", description: "", maxTeams: "", maxMembers: "", rounds: [newRound()] });
const initialForm = () => ({ name: "", description: "", startDate: "", endDate: "", tracks: [newTrack()] });

function Field({ label, required, children }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">{label}{required && <span className="text-orange-600"> *</span>}</span>{children}</label>;
}

function validate(form) {
  if (!form.name.trim()) return "Vui lòng nhập tên Event.";
  if (!form.startDate || !form.endDate || form.endDate <= form.startDate) return "Thời gian Event chưa hợp lệ.";
  if (!form.tracks.length) return "Cấu trúc phải có ít nhất một Track.";
  for (let ti = 0; ti < form.tracks.length; ti += 1) {
    const track = form.tracks[ti];
    if (!track.name.trim()) return `Track ${ti + 1} chưa có tên.`;
    const maxTeams = Number(track.maxTeams);
    const maxMembers = Number(track.maxMembers);
    if (!Number.isInteger(maxTeams) || maxTeams < 1) return `Team tối đa của Track ${ti + 1} phải là số nguyên dương.`;
    if (!Number.isInteger(maxMembers) || maxMembers < 1) return `Thành viên tối đa của Track ${ti + 1} phải là số nguyên dương.`;
    if (!track.rounds.length) return `Track ${ti + 1} phải có ít nhất một Round.`;
    for (let ri = 0; ri < track.rounds.length; ri += 1) {
      const round = track.rounds[ri];
      if (!round.name.trim()) return `Round ${ri + 1} của Track ${ti + 1} chưa có tên.`;
      if (!round.startTime || !round.endTime || round.endTime <= round.startTime) return `Thời gian Round ${ri + 1} của Track ${ti + 1} chưa hợp lệ.`;
      if (round.startTime < form.startDate || round.endTime > form.endDate) return `Round ${ri + 1} phải nằm trong thời gian Event.`;
      const advancingSlots = Number(round.advancingSlots);
      if (!Number.isInteger(advancingSlots) || advancingSlots < 1) return `Suất đi tiếp của Round ${ri + 1}, Track ${ti + 1} phải là số nguyên dương.`;
      if (advancingSlots > maxTeams) return `Suất đi tiếp của Round ${ri + 1}, Track ${ti + 1} không được vượt quá ${maxTeams} team.`;
      if (ri > 0) {
        const previousSlots = Number(track.rounds[ri - 1].advancingSlots);
        if (advancingSlots >= previousSlots) return `Suất đi tiếp của Round ${ri + 1} phải nhỏ hơn Round ${ri} trong cùng Track ${ti + 1}.`;
      }
      for (let pi = 0; pi < round.topics.length; pi += 1) {
        const topic = round.topics[pi];
        if (!topic.name.trim()) return `Topic ${pi + 1} của Round ${ri + 1} chưa có tên.`;
        const fileError = validateTopicPdf(topic.file);
        if (fileError) return `Topic ${pi + 1}: ${fileError}`;
      }
    }
  }
  return "";
}

export function CompetitionTemplateModal({ onClose, onCompleted }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [progressLabel, setProgressLabel] = useState("");

  const updateTrack = (ti, field, value) => setForm((current) => ({ ...current, tracks: current.tracks.map((track, index) => index === ti ? { ...track, [field]: value } : track) }));
  const updateRound = (ti, ri, field, value) => setForm((current) => ({ ...current, tracks: current.tracks.map((track, index) => index === ti ? { ...track, rounds: track.rounds.map((round, position) => position === ri ? { ...round, [field]: value } : round) } : track) }));
  const updateTopic = (ti, ri, pi, field, value) => setForm((current) => ({ ...current, tracks: current.tracks.map((track, trackIndex) => trackIndex === ti ? { ...track, rounds: track.rounds.map((round, roundIndex) => roundIndex === ri ? { ...round, topics: round.topics.map((topic, topicIndex) => topicIndex === pi ? { ...topic, [field]: value } : topic) } : round) } : track) }));
  const addTrack = () => setForm((current) => ({ ...current, tracks: [...current.tracks, newTrack()] }));
  const removeTrack = (ti) => setForm((current) => ({ ...current, tracks: current.tracks.filter((_, index) => index !== ti) }));
  const addRound = (ti) => setForm((current) => ({ ...current, tracks: current.tracks.map((track, index) => index === ti ? { ...track, rounds: [...track.rounds, newRound()] } : track) }));
  const removeRound = (ti, ri) => setForm((current) => ({ ...current, tracks: current.tracks.map((track, index) => index === ti ? { ...track, rounds: track.rounds.filter((_, position) => position !== ri) } : track) }));
  const addTopic = (ti, ri) => setForm((current) => ({ ...current, tracks: current.tracks.map((track, trackIndex) => trackIndex === ti ? { ...track, rounds: track.rounds.map((round, roundIndex) => roundIndex === ri ? { ...round, topics: [...round.topics, newTopic()] } : round) } : track) }));
  const removeTopic = (ti, ri, pi) => setForm((current) => ({ ...current, tracks: current.tracks.map((track, trackIndex) => trackIndex === ti ? { ...track, rounds: track.rounds.map((round, roundIndex) => roundIndex === ri ? { ...round, topics: round.topics.filter((_, topicIndex) => topicIndex !== pi) } : round) } : track) }));

  const buildPayload = async () => {
    const tracks = [];
    for (let ti = 0; ti < form.tracks.length; ti += 1) {
      const track = form.tracks[ti];
      const rounds = [];
      for (let ri = 0; ri < track.rounds.length; ri += 1) {
        const round = track.rounds[ri];
        const topics = [];
        for (let pi = 0; pi < round.topics.length; pi += 1) {
          const topic = round.topics[pi];
          let attachmentUrl = topic.attachmentUrl || null;
          if (topic.file) {
            setProgressLabel(`Đang tải PDF cho ${topic.name}`);
            const upload = await uploadTopicPdf(topic.file);
            attachmentUrl = upload.secure_url;
          }
          topics.push({ name: topic.name.trim(), description: topic.description.trim() || null, requirements: topic.requirements.trim() || null, attachmentUrl });
        }
        rounds.push({ name: round.name.trim(), startTime: new Date(round.startTime).toISOString(), endTime: new Date(round.endTime).toISOString(), advancingSlots: round.advancingSlots === "" ? null : Number(round.advancingSlots), topics });
      }
      tracks.push({ name: track.name.trim(), description: track.description.trim() || null, maxTeams: track.maxTeams === "" ? null : Number(track.maxTeams), maxMembers: track.maxMembers === "" ? null : Number(track.maxMembers), rounds });
    }
    return { name: form.name.trim(), description: form.description.trim() || null, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), tracks };
  };

  const submit = async () => {
    const validationError = validate(form);
    if (validationError) return setError(validationError);
    setSaving(true); setError(""); setProgressLabel("Đang chuẩn bị cấu trúc");
    try {
      const payload = await buildPayload();
      setProgressLabel("Đang tạo Event, Track và Round");
      const response = await eventService.createFull(payload);
      await onCompleted?.(response.data?.data);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Không thể tạo cấu trúc cuộc thi.");
    } finally { setSaving(false); setProgressLabel(""); }
  };

  return <ModalShell title="Tạo cấu trúc cuộc thi" onClose={() => !saving && onClose?.()} maxWidthClass="max-w-7xl" maxHeightClass="max-h-[92vh]" actions={<><CoordinatorActionButton disabled={saving} onClick={onClose}>Hủy</CoordinatorActionButton><CoordinatorActionButton variant="primary" disabled={saving} onClick={submit}>{saving ? <LoadingActionText>{progressLabel || "Đang tạo cấu trúc"}</LoadingActionText> : "Tạo Event, Track, Round và Topic"}</CoordinatorActionButton></>}>
    <div className="space-y-5">
      {error && <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      <section className="rounded-xl border border-orange-200 bg-orange-50/50 p-4"><div className="mb-4"><p className="font-bold text-slate-950">Thông tin Event</p><p className="text-sm text-slate-600">Event được tạo tự động ở trạng thái Registration.</p></div><div className="grid gap-3 md:grid-cols-2"><Field label="Tên Event" required><input className={inputClass} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field><Field label="Mô tả"><input className={inputClass} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></Field><Field label="Bắt đầu" required><input type="datetime-local" className={inputClass} value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></Field><Field label="Kết thúc" required><input type="datetime-local" className={inputClass} value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} /></Field></div></section>

      <div className="space-y-4">{form.tracks.map((track, ti) => <section key={ti} className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-orange-600" /><h3 className="font-bold text-slate-950">Track {ti + 1}</h3></div>{form.tracks.length > 1 && <IconButton label={`Xóa Track ${ti + 1}`} onClick={() => removeTrack(ti)} />}</div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><Field label="Tên Track" required><input className={inputClass} value={track.name} onChange={(event) => updateTrack(ti, "name", event.target.value)} /></Field><Field label="Mô tả"><input className={inputClass} value={track.description} onChange={(event) => updateTrack(ti, "description", event.target.value)} /></Field><Field label="Team tối đa" required><input required type="number" min="1" step="1" className={inputClass} value={track.maxTeams} onChange={(event) => updateTrack(ti, "maxTeams", event.target.value)} /></Field><Field label="Thành viên tối đa" required><input required type="number" min="1" step="1" className={inputClass} value={track.maxMembers} onChange={(event) => updateTrack(ti, "maxMembers", event.target.value)} /></Field></div>
        <div className="mt-4 space-y-3">{track.rounds.map((round, ri) => <div key={ri} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between"><p className="font-bold text-slate-900">Round {ri + 1}</p>{track.rounds.length > 1 && <IconButton label={`Xóa Round ${ri + 1}`} onClick={() => removeRound(ti, ri)} />}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label="Tên Round" required><input className={inputClass} value={round.name} onChange={(event) => updateRound(ti, ri, "name", event.target.value)} /></Field><Field label="Bắt đầu" required><input type="datetime-local" className={inputClass} value={round.startTime} onChange={(event) => updateRound(ti, ri, "startTime", event.target.value)} /></Field><Field label="Kết thúc" required><input type="datetime-local" className={inputClass} value={round.endTime} onChange={(event) => updateRound(ti, ri, "endTime", event.target.value)} /></Field><Field label="Suất đi tiếp" required><input required type="number" min="1" step="1" className={inputClass} value={round.advancingSlots} onChange={(event) => updateRound(ti, ri, "advancingSlots", event.target.value)} /></Field></div>
          <div className="mt-4 space-y-3">{round.topics.map((topic, pi) => <div key={pi} className="rounded-lg border border-orange-200 bg-white p-3"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-bold text-orange-800"><FileText className="h-4 w-4" />Topic {pi + 1}</div><IconButton label={`Xóa Topic ${pi + 1}`} onClick={() => removeTopic(ti, ri, pi)} /></div><div className="grid gap-3 lg:grid-cols-2"><Field label="Tên Topic" required><input className={inputClass} value={topic.name} onChange={(event) => updateTopic(ti, ri, pi, "name", event.target.value)} /></Field><Field label="Mô tả"><input className={inputClass} value={topic.description} onChange={(event) => updateTopic(ti, ri, pi, "description", event.target.value)} /></Field><Field label="Yêu cầu"><textarea className={`${inputClass} min-h-20 resize-y`} value={topic.requirements} onChange={(event) => updateTopic(ti, ri, pi, "requirements", event.target.value)} /></Field><Field label="File đề PDF"><label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-700 hover:border-orange-400"><Upload className="h-4 w-4" />{topic.file?.name || "Chọn PDF"}<input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => updateTopic(ti, ri, pi, "file", event.target.files?.[0] || null)} /></label></Field></div></div>)}<button type="button" onClick={() => addTopic(ti, ri)} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-orange-300 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50"><Plus className="h-4 w-4" />Thêm Topic</button></div>
        </div>)}<button type="button" onClick={() => addRound(ti)} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white"><Plus className="h-4 w-4" />Thêm Round</button></div>
      </section>)}</div>
      <button type="button" onClick={addTrack} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50"><Plus className="h-4 w-4" />Thêm Track</button>
    </div>
  </ModalShell>;
}

function IconButton({ label, onClick }) {
  return <button type="button" onClick={onClick} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label={label} title={label}><Trash2 className="h-4 w-4" /></button>;
}
