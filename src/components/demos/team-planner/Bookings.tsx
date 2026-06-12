/* The Hot desks and Resources tabs. Both follow the selected planning day (set on the
   Team day tab) and both mutate through the same validate-then-apply dispatch as
   everything else: reserve_desk and book_resource actions. */

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OFFICES, RESOURCES, type OfficeId, type PlanningDay, type PlannerState, type ResourceId } from "./data";
import {
  SLOT_FROM_OPTIONS,
  SLOT_TO_OPTIONS,
  officeOccupancy,
  resourceById,
  teamBadgeVariant,
  toMin,
  type Action,
  type Validation,
} from "./logic";
import { FOCUS_RING, ValidationLine, fieldClass, microLabelClass, panelClass, sectionLabelClass } from "./controls";

interface ViewProps {
  state: PlannerState;
  day: PlanningDay;
  send: (action: Action) => Validation;
}

const DISCLOSURE_BUTTON = cn(
  "mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-ink-3 transition-colors hover:text-ink-2",
  FOCUS_RING
);

export function HotDesksView({ state, day, send }: ViewProps) {
  const [openPeople, setOpenPeople] = React.useState<OfficeId | null>(null);
  const [name, setName] = React.useState("");
  const [officeId, setOfficeId] = React.useState<OfficeId>("off-syd");
  const [result, setResult] = React.useState<Validation | null>(null);

  const occupancies = OFFICES.map((o) => officeOccupancy(o.id, day.iso, state));
  const chosen = occupancies.find((o) => o.office.id === officeId);
  const chosenFull = (chosen?.free ?? 0) <= 0;

  function submitReserve(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(send({ type: "reserve_desk", args: { office: officeId, date: day.iso, name } }));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {occupancies.map(({ office, planned, reserved, byTeam, booked, free }) => (
          <div key={office.id} className={panelClass}>
            <div className={sectionLabelClass}>
              {office.name} · {office.capacity} desks · {day.label}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-serif text-2xl tnum text-ink">
                {booked}
                <span className="text-base text-ink-3"> / {office.capacity}</span>
              </span>
              <span className="text-xs text-ink-2">booked</span>
              <span className={cn("text-xs font-medium tnum", free <= 0 ? "text-neg" : "text-pos")}>
                {free} free{free <= 0 && " · full"}
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] tnum leading-relaxed text-ink-3">
              planned · {byTeam.map((t) => `${t.team} ${t.count}`).join(" · ")}
              <br />
              reserved temporarily · {reserved.length}
            </div>
            <button type="button" aria-expanded={openPeople === office.id} onClick={() => setOpenPeople((o) => (o === office.id ? null : office.id))} className={DISCLOSURE_BUTTON}>
              <ChevronDown className={cn("size-3 transition-transform", openPeople === office.id && "rotate-180")} aria-hidden />
              people ({booked})
            </button>
            {openPeople === office.id && (
              <ul className="mt-2 space-y-1 border-t border-line pt-2">
                {planned.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-2 text-xs text-ink-2">
                    <span className="truncate">{p.name}</span>
                    <Badge size="sm" variant={teamBadgeVariant(p.team)}>
                      {p.team}
                    </Badge>
                  </li>
                ))}
                {reserved.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-xs text-ink-2">
                    <span className="truncate">{r.name}</span>
                    <Badge size="sm" variant="outline">
                      reserved
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={submitReserve} className={panelClass}>
        <div className={sectionLabelClass}>Reserve a desk · {day.label}</div>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-36 flex-1">
            <label htmlFor="hd-name" className={microLabelClass}>
              Reserved for
            </label>
            <input id="hd-name" type="text" className={cn(fieldClass, "w-full")} placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="hd-office" className={microLabelClass}>
              Office
            </label>
            <select id="hd-office" className={fieldClass} value={officeId} onChange={(e) => setOfficeId(e.target.value as OfficeId)}>
              {OFFICES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline" size="sm" className="h-8 px-3 text-xs" disabled={chosenFull}>
            {chosenFull ? "office full" : "Reserve"}
          </Button>
        </div>
        <div aria-live="polite" className="mt-2">
          {result && <ValidationLine result={result} okText={`desk reserved at ${chosen?.office.name ?? officeId} · counts updated`} />}
        </div>
        <p className="mt-2 text-[11px] text-ink-3">date follows the Team day tab · plain-English requests land here too</p>
      </form>
    </section>
  );
}

export function ResourcesView({ state, day, send }: ViewProps) {
  const [resourceId, setResourceId] = React.useState<ResourceId>("boardroom-a");
  const [from, setFrom] = React.useState("14:00");
  const [to, setTo] = React.useState("15:00");
  const [name, setName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [result, setResult] = React.useState<Validation | null>(null);

  function submitBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedNote = note.trim();
    const outcome = send({
      type: "book_resource",
      args: {
        resource: resourceId,
        date: day.iso,
        from,
        to,
        bookedBy: name,
        ...(trimmedNote !== "" ? { note: trimmedNote } : {}),
      },
    });
    setResult(outcome);
    if (outcome.ok) {
      setName("");
      setNote("");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {RESOURCES.map((resource) => {
          const bookings = state.resourceBookings
            .filter((b) => b.resourceId === resource.id && b.date === day.iso)
            .sort((a, b) => toMin(a.from) - toMin(b.from));
          return (
            <div key={resource.id} className={panelClass}>
              <div className={sectionLabelClass}>
                {resource.name} · {day.label}
              </div>
              {bookings.length > 0 ? (
                <ul className="space-y-1.5">
                  {bookings.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] tnum leading-none",
                          b.viaChip ? "border-brand-line bg-brand-tint text-brand-700" : "border-line bg-surface text-ink-2"
                        )}
                      >
                        {b.from}-{b.to}
                      </span>
                      <span className="text-xs text-ink-2">{b.bookedBy}</span>
                      {b.note && <span className="text-xs text-ink-3">{b.note}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-md border border-dashed border-line px-3 py-2 font-mono text-[11px] text-ink-3">
                  no bookings for this date
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={submitBooking} className={panelClass}>
        <div className={sectionLabelClass}>Book a resource · {day.label}</div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <label htmlFor="rb-resource" className={microLabelClass}>
              Resource
            </label>
            <select id="rb-resource" className={cn(fieldClass, "w-full")} value={resourceId} onChange={(e) => setResourceId(e.target.value as ResourceId)}>
              {RESOURCES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label htmlFor="rb-from" className={microLabelClass}>
                From
              </label>
              <select id="rb-from" className={cn(fieldClass, "w-full tnum")} value={from} onChange={(e) => setFrom(e.target.value)}>
                {SLOT_FROM_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="rb-to" className={microLabelClass}>
                To
              </label>
              <select id="rb-to" className={cn(fieldClass, "w-full tnum")} value={to} onChange={(e) => setTo(e.target.value)}>
                {SLOT_TO_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="rb-name" className={microLabelClass}>
              Booked by
            </label>
            <input id="rb-name" type="text" className={cn(fieldClass, "w-full")} placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="rb-note" className={microLabelClass}>
              Note
            </label>
            <input id="rb-note" type="text" className={cn(fieldClass, "w-full")} placeholder="optional, e.g. Q4 planning" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" size="sm" className="h-8 px-3 text-xs">
            Book
          </Button>
          <div aria-live="polite">
            {result && (
              <ValidationLine result={result} okText={`booked ${resourceById(resourceId)?.name ?? resourceId}, ${from} to ${to}`} />
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
