/* The Team day tab: date navigation across the three synthetic days, a team filter,
   the pure-CSS percent-positioned timeline (the production signature), segment
   inspection, and the add-event disclosure form. All placement maths lives in logic.ts. */

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  AWAY_TYPES,
  DAYS,
  MEMBERS,
  NOTE_MAX,
  NOW_MIN,
  TEAMS,
  dayAt,
  type AwayTypeId,
  type EventKind,
  type PlannerState,
  type TeamId,
} from "./data";
import {
  HOUR_GRID_MARKS,
  HOUR_LABEL_MARKS,
  SLOT_FROM_OPTIONS,
  SLOT_TO_OPTIONS,
  buildTimelineSegments,
  fmt,
  pctOf,
  placementFor,
  type Action,
  type Validation,
} from "./logic";
import {
  FOCUS_RING,
  TONE_STYLE,
  ToneChip,
  ValidationLine,
  fieldClass,
  microLabelClass,
  panelClass,
} from "./controls";

const KIND_OPTIONS: readonly { id: EventKind; label: string }[] = [
  { id: "desk", label: "At desk" },
  { id: "away", label: "Away" },
  { id: "leave", label: "Leave" },
];

const NAV_BUTTON = cn(
  "inline-flex size-6 items-center justify-center rounded-md border border-line bg-surface text-ink-2 transition-colors hover:border-brand-line hover:bg-brand-tint/40 disabled:pointer-events-none disabled:opacity-40",
  FOCUS_RING
);

function hourLabelStyle(min: number): React.CSSProperties {
  if (pctOf(min) <= 0) return { left: 0 };
  if (pctOf(min) >= 100) return { right: 0 };
  return { left: `${pctOf(min)}%`, transform: "translateX(-50%)" };
}

interface TeamDayProps {
  state: PlannerState;
  dayIndex: number;
  onDayIndexChange: (next: number) => void;
  send: (action: Action) => Validation;
}

export default function TeamDay({ state, dayIndex, onDayIndexChange, send }: TeamDayProps) {
  const day = dayAt(dayIndex);

  const [filter, setFilter] = React.useState<"all" | TeamId>("all");
  const [selected, setSelected] = React.useState<{ memberId: string; segId: string } | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMember, setFormMember] = React.useState("priya");
  const [formKind, setFormKind] = React.useState<EventKind>("away");
  const [formAway, setFormAway] = React.useState<AwayTypeId>("lunch");
  const [formFrom, setFormFrom] = React.useState("14:00");
  const [formTo, setFormTo] = React.useState("14:30");
  const [formNote, setFormNote] = React.useState("");
  const [formResult, setFormResult] = React.useState<Validation | null>(null);

  const rows = React.useMemo(
    () => MEMBERS.map((m) => ({ member: m, segments: buildTimelineSegments(m.id, day.iso, state) })),
    [state, day.iso]
  );

  const groups = filter === "all" ? TEAMS : TEAMS.filter((t) => t.id === filter);

  const selectedInfo = React.useMemo(() => {
    if (!selected) return null;
    const row = rows.find((r) => r.member.id === selected.memberId);
    const seg = row?.segments.find((s) => s.id === selected.segId);
    return row && seg ? { member: row.member, seg } : null;
  }, [selected, rows]);

  function changeDay(next: number) {
    setSelected(null);
    setFormResult(null);
    onDayIndexChange(next);
  }

  function submitEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const note = formNote.trim();
    const action: Action = {
      type: "add_event",
      args: {
        member: formMember,
        date: day.iso,
        from: formFrom,
        to: formTo,
        kind: formKind,
        ...(formKind === "away" ? { awayType: formAway } : {}),
        ...(note !== "" ? { note } : {}),
      },
    };
    const result = send(action);
    setFormResult(result);
    if (result.ok) setFormNote("");
  }

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous day" disabled={dayIndex === 0} onClick={() => changeDay(dayIndex - 1)} className={NAV_BUTTON}>
            <ChevronLeft className="size-3.5" aria-hidden />
          </button>
          <div className="eyebrow tnum">
            {day.label}
            {day.isToday && " · today"}
          </div>
          <button type="button" aria-label="Next day" disabled={dayIndex === DAYS.length - 1} onClick={() => changeDay(dayIndex + 1)} className={NAV_BUTTON}>
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
        <div>
          <label htmlFor="td-filter" className="sr-only">
            Filter by team
          </label>
          <select id="td-filter" className={fieldClass} value={filter} onChange={(e) => setFilter(e.target.value as "all" | TeamId)}>
            <option value="all">All teams</option>
            {TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {(["desk", "home", "away", "leave"] as const).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-[11px] text-ink-3">
            <span className={cn("size-2.5 rounded-[3px] border", TONE_STYLE[t].seg)} style={TONE_STYLE[t].segStyle} aria-hidden />
            {TONE_STYLE[t].label}
          </span>
        ))}
      </div>

      <div className="relative mb-1 ml-20 h-4 sm:ml-28" aria-hidden>
        {HOUR_LABEL_MARKS.map((min) => (
          <span key={min} className="absolute font-mono text-[10px] tnum text-ink-3" style={hourLabelStyle(min)}>
            {fmt(min).slice(0, 2)}
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-20 right-0 sm:left-28" aria-hidden>
          {HOUR_GRID_MARKS.map((min) => (
            <div key={min} className="absolute inset-y-0 w-px bg-line" style={{ left: `${pctOf(min)}%` }} />
          ))}
        </div>

        <div className="space-y-1.5">
          {groups.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{group.label}</div>
              {rows
                .filter((r) => r.member.team === group.id)
                .map(({ member, segments }) => (
                  <div key={member.id} className="flex items-center">
                    <div className="w-20 shrink-0 truncate pr-2 text-xs font-medium text-ink-2 sm:w-28">{member.name}</div>
                    <div className="relative h-10 flex-1 rounded-md border border-line sm:h-12">
                      {segments.map((s) => {
                        const { left, width } = placementFor(s.from, s.to);
                        const isSel = selected?.segId === s.id && selected.memberId === member.id;
                        const t = TONE_STYLE[s.tone];
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className={cn(
                              "absolute inset-y-1 flex items-center overflow-hidden rounded border px-1.5 text-left transition-shadow",
                              t.seg,
                              isSel && "z-10 ring-2 ring-brand-600",
                              FOCUS_RING
                            )}
                            style={{ left: `${left}%`, width: `${width}%`, ...t.segStyle }}
                            aria-pressed={isSel}
                            aria-label={`${member.name}, ${fmt(s.from)} to ${fmt(s.to)}, ${t.label}: ${s.label}${s.note ? `, ${s.note}` : ""}`}
                            onClick={() => setSelected(isSel ? null : { memberId: member.id, segId: s.id })}
                          >
                            <span className="truncate font-mono text-[10px]">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>

        {day.isToday && (
          <div className="pointer-events-none absolute inset-y-0 left-20 right-0 sm:left-28" aria-hidden>
            <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 rounded-full bg-brand/80" style={{ left: `${pctOf(NOW_MIN)}%` }} />
          </div>
        )}
      </div>

      <div className="relative ml-20 mt-0.5 h-4 sm:ml-28" aria-hidden>
        {day.isToday && (
          <span className="absolute -translate-x-1/2 font-mono text-[9px] font-medium tnum text-brand-700" style={{ left: `${pctOf(NOW_MIN)}%` }}>
            now {fmt(NOW_MIN)}
          </span>
        )}
      </div>

      <div aria-live="polite">
        {selectedInfo ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-line bg-elevated px-4 py-2.5">
            <span className="text-sm font-medium text-ink">{selectedInfo.member.name}</span>
            <span className="font-mono text-xs tnum text-ink-2">
              {fmt(selectedInfo.seg.from)}-{fmt(selectedInfo.seg.to)}
            </span>
            <ToneChip tone={selectedInfo.seg.tone} />
            <span className="text-xs text-ink-2">{selectedInfo.seg.label}</span>
            {selectedInfo.seg.note && <span className="text-xs text-ink-3">{selectedInfo.seg.note}</span>}
          </div>
        ) : (
          <div className="mt-1 rounded-lg border border-dashed border-line px-4 py-2.5 font-mono text-[11px] text-ink-3">
            click a segment to inspect it
          </div>
        )}
      </div>

      <div className="mt-2">
        <button
          type="button"
          aria-expanded={formOpen}
          onClick={() => setFormOpen((o) => !o)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-2 transition-colors hover:border-brand-line hover:bg-brand-tint/40",
            FOCUS_RING
          )}
        >
          <Plus className="size-3" aria-hidden /> Add event · {day.label}
        </button>

        {formOpen && (
          <form onSubmit={submitEvent} className={cn(panelClass, "mt-2")}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor="ae-member" className={microLabelClass}>
                  Member
                </label>
                <select id="ae-member" className={cn(fieldClass, "w-full")} value={formMember} onChange={(e) => setFormMember(e.target.value)}>
                  {MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <label htmlFor="ae-kind" className={microLabelClass}>
                    Type
                  </label>
                  <select
                    id="ae-kind"
                    className={cn(fieldClass, "w-full")}
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value as EventKind)}
                  >
                    {KIND_OPTIONS.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
                {formKind === "away" && (
                  <div className="flex-1">
                    <label htmlFor="ae-away" className={microLabelClass}>
                      Away type
                    </label>
                    <select id="ae-away" className={cn(fieldClass, "w-full")} value={formAway} onChange={(e) => setFormAway(e.target.value as AwayTypeId)}>
                      {AWAY_TYPES.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <label htmlFor="ae-from" className={microLabelClass}>
                    From
                  </label>
                  <select id="ae-from" className={cn(fieldClass, "w-full tnum")} value={formFrom} onChange={(e) => setFormFrom(e.target.value)}>
                    {SLOT_FROM_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="ae-to" className={microLabelClass}>
                    To
                  </label>
                  <select id="ae-to" className={cn(fieldClass, "w-full tnum")} value={formTo} onChange={(e) => setFormTo(e.target.value)}>
                    {SLOT_TO_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="ae-note" className={microLabelClass}>
                  Note{" "}
                  <span className={cn("tnum", formNote.trim().length > NOTE_MAX ? "text-neg" : "text-ink-3")}>
                    · {formNote.trim().length}/{NOTE_MAX}
                  </span>
                </label>
                <input
                  id="ae-note"
                  type="text"
                  className={cn(fieldClass, "w-full")}
                  placeholder="optional"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="submit" variant="outline" size="sm" className="h-8 px-3 text-xs">
                Add event
              </Button>
              <div aria-live="polite">
                {formResult && <ValidationLine result={formResult} okText="event added · timeline updated" />}
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
