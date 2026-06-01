import { useState } from "react";
import { topics } from "../coordinatorMockData";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  ModalShell,
  icons,
} from "../CoordinatorUI";

export function TopicsManagement() {
  const [selected, setSelected] = useState(null);
  return (
    <div className="space-y-6">
      <CoordinatorPanel
        title="Topic filters"
        subtitle="Filter by track, round, or publication status"
        icon={icons.Filter}
        actions={
          <CoordinatorActionButton variant="primary" icon={icons.Plus}>
            Add Topic
          </CoordinatorActionButton>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <select className="rounded-xl border border-slate-200 px-3 py-2.5">
            <option>All tracks</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2.5">
            <option>All rounds</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2.5">
            <option>All statuses</option>
          </select>
        </div>
      </CoordinatorPanel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelected(topic)}
            className="rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            style={{ borderColor: "#E5E7EB" }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{topic.name}</h3>
                <p className="text-sm text-slate-500">
                  {topic.track} • {topic.round}
                </p>
              </div>
              <CoordinatorBadge
                tone={topic.status === "Published" ? "success" : "warning"}
              >
                {topic.status}
              </CoordinatorBadge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Files</p>
                <p className="font-bold">{topic.attachments}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Teams</p>
                <p className="font-bold">{topic.assignedTeams}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Random</p>
                <p className="font-bold">
                  {topic.randomAssigned ? "On" : "Off"}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <ModalShell
          title="Topic details"
          onClose={() => setSelected(null)}
          actions={
            <CoordinatorActionButton
              variant="primary"
              onClick={() => setSelected(null)}
            >
              Done
            </CoordinatorActionButton>
          }
        >
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-bold text-slate-900">Topic:</span>{" "}
              {selected.name}
            </p>
            <p>
              <span className="font-bold text-slate-900">Attachments:</span>{" "}
              {selected.attachments} requirement files attached
            </p>
            <p>
              <span className="font-bold text-slate-900">
                Random assignment:
              </span>{" "}
              {selected.randomAssigned ? "Enabled" : "Not enabled"}
            </p>
            <p>
              <span className="font-bold text-slate-900">
                Round association:
              </span>{" "}
              {selected.round}
            </p>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
