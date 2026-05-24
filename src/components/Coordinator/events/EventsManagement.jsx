import { useState } from "react";
import { events } from "../coordinatorMockData";
import { CoordinatorActionButton, CoordinatorBadge, CoordinatorPanel, CoordinatorTable, ModalShell, icons } from "../CoordinatorUI";

export function EventsManagement() {
  const [modal, setModal] = useState(null);
  const columns = [
    { key: "name", label: "Name" },
    { key: "dates", label: "Dates" },
    { key: "status", label: "Status" },
    { key: "teams", label: "Teams" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6">
      <CoordinatorPanel
        title="Event controls"
        subtitle="Search and filter hackathon events"
        icon={icons.Filter}
        actions={<CoordinatorActionButton variant="primary" icon={icons.Plus} onClick={() => setModal("event")}>Create Event</CoordinatorActionButton>}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2"><icons.Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm" placeholder="Search events" /></div>
          <select className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600"><option>All statuses</option><option>Draft</option><option>Open</option><option>Ongoing</option><option>Closed</option></select>
        </div>
      </CoordinatorPanel>

      <CoordinatorPanel title="Events" subtitle="Only one event can be active at a time" icon={icons.CalendarDays}>
        <CoordinatorTable columns={columns} rows={events} renderCell={(row, key) => {
          if (key === "name") return <div><p className="font-bold text-slate-900">{row.name}</p><p className="text-xs text-slate-500">{row.description}</p></div>;
          if (key === "dates") return `${row.startDate} → ${row.endDate}`;
          if (key === "status") return <div className="flex gap-2"><CoordinatorBadge tone={row.status === "Ongoing" ? "success" : row.status === "Draft" ? "warning" : row.status === "Open" ? "orange" : "neutral"}>{row.status}</CoordinatorBadge>{row.active && <CoordinatorBadge tone="orange">Active event</CoordinatorBadge>}</div>;
          if (key === "actions") return <div className="flex gap-2"><CoordinatorActionButton icon={icons.Edit3}>Edit</CoordinatorActionButton><CoordinatorActionButton variant="danger" icon={icons.Trash2} onClick={() => setModal("delete")}>Soft delete</CoordinatorActionButton></div>;
          return row[key];
        }} />
      </CoordinatorPanel>

      {modal === "event" && <ModalShell title="Create / Edit Event" onClose={() => setModal(null)} actions={<><CoordinatorActionButton onClick={() => setModal(null)}>Cancel</CoordinatorActionButton><CoordinatorActionButton variant="primary" onClick={() => setModal(null)}>Save Event</CoordinatorActionButton></>}>
        <div className="grid gap-3"><input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Event name" /><textarea className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Description" /><div className="grid gap-3 sm:grid-cols-2"><input type="date" className="rounded-xl border border-slate-200 px-3 py-2.5" /><input type="date" className="rounded-xl border border-slate-200 px-3 py-2.5" /></div><select className="rounded-xl border border-slate-200 px-3 py-2.5"><option>Draft</option><option>Open</option><option>Ongoing</option><option>Closed</option></select></div>
      </ModalShell>}
      {modal === "delete" && <ModalShell title="Soft delete event?" onClose={() => setModal(null)} actions={<><CoordinatorActionButton onClick={() => setModal(null)}>Cancel</CoordinatorActionButton><CoordinatorActionButton variant="danger" onClick={() => setModal(null)}>Confirm soft delete</CoordinatorActionButton></>}><p className="text-sm text-slate-600">This event will be hidden from active management but retained for audit history.</p></ModalShell>}
    </div>
  );
}
