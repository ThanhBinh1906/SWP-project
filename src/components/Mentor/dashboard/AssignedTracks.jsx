import { MentorBadge } from "../shared/MentorBadge";
import { MentorPanel } from "../shared/MentorPanel";
import { mentorIcons } from "../shared/mentorIcons";

export function AssignedTracks({ teams = [] }) {
  const tracks = Array.from(
    teams.reduce((groups, team) => {
      const key = team.trackId ?? "unknown";
      const group = groups.get(key) || { id: key, teams: [] };
      group.teams.push(team);
      groups.set(key, group);
      return groups;
    }, new Map()).values(),
  );

  return (
    <MentorPanel title="Track được phân công" subtitle="Các team được gom theo track từ dữ liệu thực tế" icon={mentorIcons.GitBranch}>
      {tracks.length ? <div className="grid gap-4 md:grid-cols-2">
        {tracks.map((track) => {
          const submitted = track.teams.filter((team) => team.submissionStatus === "Submitted").length;
          return <div key={track.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wide text-slate-700">Track</p><h4 className="mt-1 font-bold text-slate-950">Track #{track.id}</h4></div>
              <MentorBadge tone="orange">{track.teams.length} team</MentorBadge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{track.teams.map((team) => <span key={team.id} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">{team.teamName}</span>)}</div>
            <p className="mt-4 text-sm text-slate-600">{submitted}/{track.teams.length} team đã có bài nộp</p>
          </div>;
        })}
      </div> : <p className="py-8 text-center text-sm text-slate-700">Chưa có team nào được phân công.</p>}
    </MentorPanel>
  );
}
