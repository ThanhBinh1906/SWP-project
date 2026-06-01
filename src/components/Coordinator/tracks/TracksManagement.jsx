import { tracks } from "../coordinatorMockData";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorProgressBar,
  icons,
} from "../CoordinatorUI";

export function TracksManagement() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="rounded-2xl border bg-white p-5"
            style={{
              borderColor: "#E5E7EB",
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
            }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{track.name}</h3>
                <p className="text-sm text-slate-500">{track.event}</p>
              </div>
              <CoordinatorBadge
                tone={track.status === "Full" ? "warning" : "success"}
              >
                {track.status}
              </CoordinatorBadge>
            </div>
            <CoordinatorProgressBar
              label={`${track.teams}/${track.maxTeams} teams`}
              value={Math.round((track.teams / track.maxTeams) * 100)}
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Mentors</p>
                <p className="font-bold text-slate-900">{track.mentors}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Topics</p>
                <p className="font-bold text-slate-900">{track.topics}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <CoordinatorPanel
        title="Track detail panel"
        subtitle="Capacity, event association, and CRUD controls"
        icon={icons.GitBranch}
        actions={
          <CoordinatorActionButton variant="primary" icon={icons.Plus}>
            Add Track
          </CoordinatorActionButton>
        }
      >
        <div className="space-y-3">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-slate-900">{track.name}</p>
                <p className="text-sm text-slate-500">
                  Associated event: {track.event} • Max teams: {track.maxTeams}
                </p>
              </div>
              <div className="flex gap-2">
                <CoordinatorActionButton icon={icons.Eye}>
                  Details
                </CoordinatorActionButton>
                <CoordinatorActionButton icon={icons.Edit3}>
                  Edit
                </CoordinatorActionButton>
              </div>
            </div>
          ))}
        </div>
      </CoordinatorPanel>
    </div>
  );
}
