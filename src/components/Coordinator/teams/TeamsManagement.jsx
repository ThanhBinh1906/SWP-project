import { useState } from "react";
import { teams } from "../coordinatorMockData";
import { CoordinatorActionButton, CoordinatorBadge, CoordinatorPanel, CoordinatorProgressBar, CoordinatorTable, ModalShell, icons } from "../CoordinatorUI";

export function TeamsManagement() {
  const [selected, setSelected] = useState(null);
  const [disqualify, setDisqualify] = useState(null);
  const columns = [{ key: "name", label: "Team" }, { key: "track", label: "Track" }, { key: "mentor", label: "Mentor" }, { key: "status", label: "Status" }, { key: "readiness", label: "Readiness" }, { key: "actions", label: "Actions" }];
  return (
    <div className="space-y-6">
      <CoordinatorPanel title="Team list" subtitle="Approve, inspect, or disqualify participating teams" icon={icons.UserRoundCog}>
        <CoordinatorTable columns={columns} rows={teams} renderCell={(row, key) => {
          if (key === "name") return <div><p className="font-bold text-slate-900">{row.name}</p><p className="text-xs text-slate-500">Leader: {row.leader} • {row.members} members</p></div>;
          if (key === "status") return <CoordinatorBadge tone={row.status === "Approved" ? "success" : row.status === "Disqualified" ? "danger" : "warning"}>{row.status}</CoordinatorBadge>;
          if (key === "readiness") return <div className="w-40"><CoordinatorProgressBar value={row.readiness} /></div>;
          if (key === "actions") return <div className="flex gap-2"><CoordinatorActionButton icon={icons.Eye} onClick={() => setSelected(row)}>Details</CoordinatorActionButton><CoordinatorActionButton variant="primary">Approve</CoordinatorActionButton><CoordinatorActionButton variant="danger" onClick={() => setDisqualify(row)}>Disqualify</CoordinatorActionButton></div>;
          return row[key];
        }} />
      </CoordinatorPanel>
      {selected && <ModalShell title="Team detail" onClose={() => setSelected(null)} actions={<CoordinatorActionButton variant="primary" onClick={() => setSelected(null)}>Close</CoordinatorActionButton>}><div className="space-y-3 text-sm text-slate-600"><p><b className="text-slate-900">Team:</b> {selected.name}</p><p><b className="text-slate-900">Submission:</b> {selected.submission}</p><p><b className="text-slate-900">Score:</b> {selected.score}</p><CoordinatorProgressBar label="Submission readiness" value={selected.readiness} /></div></ModalShell>}
      {disqualify && <ModalShell title={`Disqualify ${disqualify.name}?`} onClose={() => setDisqualify(null)} actions={<><CoordinatorActionButton onClick={() => setDisqualify(null)}>Cancel</CoordinatorActionButton><CoordinatorActionButton variant="danger" onClick={() => setDisqualify(null)}>Confirm</CoordinatorActionButton></>}><textarea className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Disqualification reason" /></ModalShell>}
    </div>
  );
}
