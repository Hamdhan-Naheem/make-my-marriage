import { events, workspace } from "@/content/landing-content";

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-xl border border-[#e8dfd8] bg-[#fcf9f8] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[#7f2736]">{label}</p><p className="mt-1 text-lg font-bold text-[#1b1c1c]">{value}</p><p className="text-xs text-[#554243]">{note}</p></div>;
}

export function WorkspacePreview() {
  return (
    <div aria-label="Illustrative Owner dashboard preview" className="overflow-hidden rounded-2xl border border-[#e8dfd8] bg-white shadow-[0_20px_45px_-30px_rgba(103,21,37,0.4)]">
      <div className="flex items-center justify-between border-b border-[#e8dfd8] px-4 py-3 sm:px-5">
        <div><p className="text-sm font-bold text-[#1b1c1c]">{workspace.couple}&apos;s Wedding</p><p className="text-xs text-[#554243]">Owner view · {workspace.location}</p></div>
        <span className="rounded-full bg-[#f6e6e2] px-2.5 py-1 text-xs font-semibold text-[#7f2736]">Illustrative</span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        <Metric label="Budget" note={`${workspace.committed} committed`} value={workspace.totalBudget} />
        <Metric label="Tasks" note={`${workspace.taskComplete} of ${workspace.taskTotal} complete`} value={`${workspace.taskInProgress} in progress`} />
        <Metric label="Guests" note={`${workspace.confirmed} confirmed · ${workspace.pending} pending`} value={`${workspace.invited} invited`} />
      </div>
      <div className="border-t border-[#e8dfd8] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-bold text-[#1b1c1c]">Upcoming celebrations</p><p className="text-xs text-[#554243]">Custom events, organized in one wedding workspace</p></div><span className="hidden rounded-md bg-[#f6f3f2] px-2 py-1 text-xs font-semibold text-[#554243] sm:block">Sample schedule</span></div>
        <div className="grid gap-2">
          {events.slice(0, 3).map((event) => <div className="flex items-center gap-3 rounded-lg bg-[#fcf9f8] p-3" key={event.name}><span className="w-11 shrink-0 text-center text-xs font-bold leading-4 text-[#671525]">{event.date}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#1b1c1c]">{event.name}</span><span className="block truncate text-xs text-[#554243]">{event.place} · {event.guests}</span></span><span className="hidden rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#7f2736] sm:inline">{event.side}</span></div>)}
        </div>
      </div>
      <p className="border-t border-[#e8dfd8] px-4 py-2 text-center text-xs text-[#554243]">Illustrative example — all names and information are fictional.</p>
    </div>
  );
}
