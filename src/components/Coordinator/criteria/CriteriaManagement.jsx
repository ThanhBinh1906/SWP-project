import { useMemo, useState } from "react";
import { criteria } from "../coordinatorMockData";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorProgressBar,
  CoordinatorTable,
  ModalShell,
  icons,
} from "../CoordinatorUI";

export function CriteriaManagement() {
  const [modal, setModal] = useState(null);
  const totalWeight = useMemo(
    () => criteria.reduce((sum, item) => sum + item.weight, 0),
    [],
  );
  const valid = Math.abs(totalWeight - 1) < 0.001;
  const columns = [
    { key: "name", label: "Criterion" },
    { key: "maxScore", label: "Max score" },
    { key: "weight", label: "Weight" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6">
      <CoordinatorPanel
        title="Weight validation"
        subtitle="Total rubric weight must equal 1.0"
        icon={icons.SlidersHorizontal}
        actions={
          <>
            <CoordinatorActionButton icon={icons.Upload}>
              Import template
            </CoordinatorActionButton>
            <CoordinatorActionButton
              variant="primary"
              icon={icons.Plus}
              onClick={() => setModal("criterion")}
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
          <p className="mt-3 text-sm text-slate-600">
            {valid
              ? "Rubric weights are ready for scoring."
              : "Adjust weights before final scoring starts."}
          </p>
        </div>
      </CoordinatorPanel>
      <CoordinatorPanel
        title="Criteria table"
        subtitle="Add, edit, delete, and review scoring rubrics"
        icon={icons.Scale}
      >
        <CoordinatorTable
          columns={columns}
          rows={criteria}
          renderCell={(row, key) => {
            if (key === "weight")
              return (
                <span className="font-bold text-slate-900">
                  {row.weight.toFixed(2)}
                </span>
              );
            if (key === "status")
              return (
                <CoordinatorBadge tone="success">{row.status}</CoordinatorBadge>
              );
            if (key === "actions")
              return (
                <div className="flex gap-2">
                  <CoordinatorActionButton icon={icons.Edit3}>
                    Edit
                  </CoordinatorActionButton>
                  <CoordinatorActionButton variant="danger" icon={icons.Trash2}>
                    Delete
                  </CoordinatorActionButton>
                </div>
              );
            return row[key];
          }}
        />
      </CoordinatorPanel>
      {modal && (
        <ModalShell
          title="Add / Edit Criterion"
          onClose={() => setModal(null)}
          actions={
            <>
              <CoordinatorActionButton onClick={() => setModal(null)}>
                Cancel
              </CoordinatorActionButton>
              <CoordinatorActionButton
                variant="primary"
                onClick={() => setModal(null)}
              >
                Save
              </CoordinatorActionButton>
            </>
          }
        >
          <div className="grid gap-3">
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5"
              placeholder="Name"
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5"
              placeholder="Max score"
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5"
              placeholder="Weight, e.g. 0.30"
            />
          </div>
        </ModalShell>
      )}
    </div>
  );
}
