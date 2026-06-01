import { rounds } from "../coordinatorMockData";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorProgressBar,
  icons,
} from "../CoordinatorUI";

export function RoundsManagement() {
  return (
    <div className="space-y-6">
      <CoordinatorPanel
        title="Round timeline"
        subtitle="Configure timing, status, and advancement slots"
        icon={icons.Timer}
        actions={
          <CoordinatorActionButton variant="primary" icon={icons.Plus}>
            Create Round
          </CoordinatorActionButton>
        }
      >
        <div className="space-y-5">
          {rounds.map((round, index) => (
            <div
              key={round.id}
              className="grid gap-4 rounded-2xl border border-slate-100 p-4 lg:grid-cols-[auto_1fr_220px]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{
                    background:
                      round.status === "Active" ? "#F26F21" : "#94A3B8",
                  }}
                >
                  {index + 1}
                </div>
                <CoordinatorBadge
                  tone={
                    round.status === "Active"
                      ? "orange"
                      : round.status === "Scoring"
                        ? "purple"
                        : round.status === "Closed"
                          ? "success"
                          : "neutral"
                  }
                >
                  {round.status}
                </CoordinatorBadge>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{round.name}</h3>
                <p className="text-sm text-slate-500">
                  {round.startTime} → {round.endTime}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Advancing slots:{" "}
                  <span className="font-bold text-slate-800">
                    {round.advancingSlots}
                  </span>
                </p>
              </div>
              <CoordinatorProgressBar
                label="Progress"
                value={round.progress}
                color={round.status === "Active" ? "#F26F21" : "#64748B"}
              />
            </div>
          ))}
        </div>
      </CoordinatorPanel>
    </div>
  );
}
