/* Pure planner logic, no React imports. Three concerns live here, each mirroring a
   production behaviour by name:
   - timeline computation: buildTimelineSegments() and placementFor() (pure CSS percent maths)
   - the typed Action union with validate() (production parseTeamStateAction(), path errors)
   - apply(), the pure reducer that turns a validated action into the next state */

import {
  AWAY_TYPES,
  DAYS,
  DAY_END_MIN,
  DAY_START_MIN,
  MEMBERS,
  NOTE_MAX,
  OFFICES,
  OFFICE_EXTRAS,
  RESOURCES,
  TEAMS,
  type AwayTypeId,
  type DeskReservation,
  type EventKind,
  type IntradayEvent,
  type LocationId,
  type Member,
  type Office,
  type OfficeId,
  type PlannedPerson,
  type PlannerState,
  type Resource,
  type ResourceId,
  type Tone,
} from "./data";

/* ---------- time helpers ---------- */

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h ?? "0") * 60 + Number(m ?? "0");
}

export function fmt(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function marks(step: number, from: number, to: number): readonly number[] {
  const out: number[] = [];
  for (let m = from; m <= to; m += step) out.push(m);
  return out;
}

/** Labelled hours (every 2h) and the lighter hour grid between them. */
export const HOUR_LABEL_MARKS = marks(120, DAY_START_MIN, DAY_END_MIN);
export const HOUR_GRID_MARKS = marks(60, DAY_START_MIN + 60, DAY_END_MIN - 60);

/** 30-minute slot options across the working window, for the booking forms. */
const SLOT_TIMES = marks(30, DAY_START_MIN, DAY_END_MIN).map(fmt);
export const SLOT_FROM_OPTIONS = SLOT_TIMES.slice(0, -1);
export const SLOT_TO_OPTIONS = SLOT_TIMES.slice(1);

/* ---------- lookups ---------- */

export function memberById(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}

export function officeById(id: string): Office | undefined {
  return OFFICES.find((o) => o.id === id);
}

export function resourceById(id: string): Resource | undefined {
  return RESOURCES.find((r) => r.id === id);
}

export function teamLabelOf(id: string): string {
  return TEAMS.find((t) => t.id === id)?.label ?? id;
}

export function dayLabelOf(iso: string): string {
  return DAYS.find((d) => d.iso === iso)?.label ?? iso;
}

function awayTypeLabel(id: AwayTypeId): string {
  return AWAY_TYPES.find((a) => a.id === id)?.label ?? id;
}

/** Bar label for an event: explicit override, else its away type, else its kind. */
function eventLabel(ev: { kind: EventKind; awayType?: AwayTypeId; label?: string }): string {
  if (ev.label !== undefined) return ev.label;
  if (ev.kind === "away" && ev.awayType !== undefined) return awayTypeLabel(ev.awayType);
  return ev.kind === "leave" ? "Leave" : "Desk";
}

/* ---------- timeline computation ---------- */

export interface TimelineSegment {
  id: string;
  from: number; // minutes from midnight
  to: number;
  tone: Tone;
  label: string;
  note?: string;
}

const BASE_TONE: Record<LocationId, Tone> = { office: "desk", home: "home", leave: "leave" };
const BASE_LABEL: Record<LocationId, string> = { office: "Desk", home: "Home", leave: "Leave" };

interface BaseInterval {
  from: number;
  to: number;
  location: LocationId;
  label: string;
  note?: string;
}

/** A member's base day: office desk by default, re-based by each DayStatusOverride
    from its `from` minute onwards (production folds the weekly schedule in here too). */
function baseIntervals(memberId: string, date: string, state: PlannerState): BaseInterval[] {
  const statuses = state.dayStatuses
    .filter((s) => s.memberId === memberId && s.date === date)
    .sort((a, b) => toMin(a.from) - toMin(b.from));
  const intervals: BaseInterval[] = [];
  let cursor = DAY_START_MIN;
  let current: Omit<BaseInterval, "from" | "to"> = { location: "office", label: BASE_LABEL.office };
  for (const s of statuses) {
    const at = Math.max(toMin(s.from), DAY_START_MIN);
    if (at > cursor) {
      intervals.push({ from: cursor, to: at, ...current });
      cursor = at;
    }
    current = {
      location: s.location,
      label: s.label ?? BASE_LABEL[s.location],
      ...(s.note !== undefined ? { note: s.note } : {}),
    };
  }
  if (cursor < DAY_END_MIN) intervals.push({ from: cursor, to: DAY_END_MIN, ...current });
  return intervals;
}

function baseLocationAt(base: readonly BaseInterval[], min: number): LocationId {
  return base.find((iv) => iv.from <= min && min < iv.to)?.location ?? "office";
}

/** Production buildTimelineSegments(): overlay intraday events on the base day, carve the
    base around them, then merge adjacent identical segments. Events never overlap each
    other; validate() guarantees that before anything reaches state. */
export function buildTimelineSegments(memberId: string, date: string, state: PlannerState): TimelineSegment[] {
  const base = baseIntervals(memberId, date, state);
  const events = state.events
    .filter((ev) => ev.memberId === memberId && ev.date === date)
    .sort((a, b) => toMin(a.from) - toMin(b.from));

  const segs: TimelineSegment[] = [];
  const pushBase = (a: number, b: number) => {
    for (const iv of base) {
      const from = Math.max(iv.from, a);
      const to = Math.min(iv.to, b);
      if (to > from) {
        segs.push({
          id: `base-${memberId}-${from}`,
          from,
          to,
          tone: BASE_TONE[iv.location],
          label: iv.label,
          ...(iv.note !== undefined ? { note: iv.note } : {}),
        });
      }
    }
  };

  let cursor = DAY_START_MIN;
  for (const ev of events) {
    const from = Math.max(toMin(ev.from), DAY_START_MIN);
    const to = Math.min(toMin(ev.to), DAY_END_MIN);
    if (from > cursor) pushBase(cursor, from);
    const tone: Tone =
      ev.kind === "away" ? "away"
      : ev.kind === "leave" ? "leave"
      : baseLocationAt(base, from) === "home" ? "home"
      : "desk";
    segs.push({ id: ev.id, from, to, tone, label: eventLabel(ev), ...(ev.note !== undefined ? { note: ev.note } : {}) });
    cursor = Math.max(cursor, to);
  }
  if (cursor < DAY_END_MIN) pushBase(cursor, DAY_END_MIN);

  // merge adjacent identical segments, as production does after carving
  const merged: TimelineSegment[] = [];
  for (const s of segs) {
    const prev = merged[merged.length - 1];
    if (prev && prev.to === s.from && prev.tone === s.tone && prev.label === s.label && prev.note === s.note) {
      prev.to = s.to;
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

/** Hour marker and now-line position: percent of the 08:00 to 18:00 working window. */
export function pctOf(min: number): number {
  return ((min - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)) * 100;
}

/** Production computeEventPlacements(): left/width as percent of the window, min 1.5% wide. */
export function placementFor(from: number, to: number): { left: number; width: number } {
  const total = DAY_END_MIN - DAY_START_MIN;
  return { left: ((from - DAY_START_MIN) / total) * 100, width: Math.max(((to - from) / total) * 100, 1.5) };
}

/* ---------- the typed action union and its validator ---------- */

/** Every mutation (and the one read the demo uses) is an Action. The manual forms and the
    plain-English chips both dispatch these through validate() then apply(); production's
    parseTeamStateAction() covers eighteen action types with the same shape. */
export type Action =
  | { type: "add_event"; args: { member: string; date: string; from: string; to: string; kind: EventKind; awayType?: AwayTypeId; note?: string } }
  | { type: "set_day_status"; args: { member: string; date: string; location: LocationId; from?: string; note?: string } }
  | { type: "reserve_desk"; args: { office: string; date: string; name: string } }
  | { type: "book_resource"; args: { resource: string; date: string; from: string; to: string; bookedBy: string; note?: string } }
  | { type: "get_team_at"; args: { date: string; at: string } };

export type Validation = { ok: true } | { ok: false; path: string; message: string };

const OK: Validation = { ok: true };
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function err(path: string, message: string): Validation {
  return { ok: false, path, message };
}

function badDate(path: string, value: string): Validation | null {
  return ISO_DATE_RE.test(value) ? null : err(path, "expected YYYY-MM-DD");
}

function badTime(path: string, value: string): Validation | null {
  if (!HHMM_RE.test(value)) return err(path, "expected HH:mm");
  const m = toMin(value);
  if (m < DAY_START_MIN || m > DAY_END_MIN) {
    return err(path, `outside the ${fmt(DAY_START_MIN)} to ${fmt(DAY_END_MIN)} working window`);
  }
  return null;
}

function badNote(note: string | undefined): Validation | null {
  if (note !== undefined && note.length > NOTE_MAX) {
    return err("args.note", `max ${NOTE_MAX} characters (got ${note.length})`);
  }
  return null;
}

function overlaps(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return toMin(aFrom) < toMin(bTo) && toMin(bFrom) < toMin(aTo);
}

/** Production parseTeamStateAction(): format checks, ordering, reference integrity and
    non-overlap against existing state, reported as a path plus a message. Checks run in
    Zod order: shape first, then references, then business constraints. */
export function validate(action: Action, state: PlannerState): Validation {
  switch (action.type) {
    case "add_event": {
      const { args } = action;
      const shape = badDate("args.date", args.date) ?? badTime("args.from", args.from) ?? badTime("args.to", args.to);
      if (shape) return shape;
      if (toMin(args.to) <= toMin(args.from)) return err("args.to", "must be after args.from");
      const member = memberById(args.member);
      if (!member) return err("args.member", `unknown member id "${args.member}"`);
      if (state.dayStatuses.some((s) => s.memberId === member.id && s.date === args.date && s.location === "leave")) {
        return err("args.member", `${member.name} is on leave on ${dayLabelOf(args.date)}`);
      }
      if (args.kind === "away" && args.awayType === undefined) return err("args.awayType", "required when kind is away");
      if (args.kind !== "away" && args.awayType !== undefined) return err("args.awayType", "only allowed when kind is away");
      if (args.awayType !== undefined && !AWAY_TYPES.some((a) => a.id === args.awayType)) {
        return err("args.awayType", `unknown away type "${args.awayType}"`);
      }
      const note = badNote(args.note);
      if (note) return note;
      const clash = state.events.find(
        (ev) => ev.memberId === member.id && ev.date === args.date && overlaps(args.from, args.to, ev.from, ev.to)
      );
      if (clash) return err("overlap", `clashes with ${clash.from}-${clash.to} (${eventLabel(clash)})`);
      return OK;
    }
    case "set_day_status": {
      const { args } = action;
      const shape = badDate("args.date", args.date) ?? (args.from !== undefined ? badTime("args.from", args.from) : null);
      if (shape) return shape;
      if (!memberById(args.member)) return err("args.member", `unknown member id "${args.member}"`);
      return badNote(args.note) ?? OK;
    }
    case "reserve_desk": {
      const { args } = action;
      const shape = badDate("args.date", args.date);
      if (shape) return shape;
      const office = officeById(args.office);
      if (!office) return err("args.office", `unknown office id "${args.office}"`);
      if (args.name.trim() === "") return err("args.name", "required");
      if (args.name.trim().length > 60) return err("args.name", "max 60 characters");
      if (officeOccupancy(office.id, args.date, state).free <= 0) {
        return err("args.office", `${office.name} is full on ${dayLabelOf(args.date)}`);
      }
      return OK;
    }
    case "book_resource": {
      const { args } = action;
      const shape = badDate("args.date", args.date) ?? badTime("args.from", args.from) ?? badTime("args.to", args.to);
      if (shape) return shape;
      if (toMin(args.to) <= toMin(args.from)) return err("args.to", "must be after args.from");
      const resource = resourceById(args.resource);
      if (!resource) return err("args.resource", `unknown resource id "${args.resource}"`);
      if (args.bookedBy.trim() === "") return err("args.bookedBy", "required");
      const note = badNote(args.note);
      if (note) return note;
      const clash = state.resourceBookings.find(
        (b) => b.resourceId === resource.id && b.date === args.date && overlaps(args.from, args.to, b.from, b.to)
      );
      if (clash) return err("overlap", `clashes with ${clash.from}-${clash.to} (${clash.bookedBy})`);
      return OK;
    }
    case "get_team_at": {
      const { args } = action;
      if (!ISO_DATE_RE.test(args.date)) return err("args.date", "expected YYYY-MM-DD");
      if (!HHMM_RE.test(args.at)) return err("args.at", "expected HH:mm");
      return OK;
    }
  }
}

/* ---------- the pure reducer ---------- */

/** Applies an already-validated action; never call with one validate() rejected.
    Pure: same state and action in, same state out. Reads return state unchanged. */
export function apply(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case "add_event": {
      const { args } = action;
      const event: IntradayEvent = {
        id: `evt-${args.date}-${args.from}-${args.member}`,
        memberId: args.member,
        date: args.date,
        from: args.from,
        to: args.to,
        kind: args.kind,
        ...(args.awayType !== undefined ? { awayType: args.awayType } : {}),
        ...(args.note !== undefined && args.note !== "" ? { note: args.note } : {}),
      };
      return { ...state, events: [...state.events, event] };
    }
    case "set_day_status": {
      const { args } = action;
      const from = args.from ?? fmt(DAY_START_MIN);
      const kept = state.dayStatuses.filter(
        (s) => !(s.memberId === args.member && s.date === args.date && toMin(s.from) >= toMin(from))
      );
      return {
        ...state,
        dayStatuses: [
          ...kept,
          {
            id: `ds-${args.member}-${args.date}-${from}`,
            memberId: args.member,
            date: args.date,
            location: args.location,
            from,
            ...(args.note !== undefined ? { note: args.note } : {}),
          },
        ],
      };
    }
    case "reserve_desk": {
      const { args } = action;
      const reservation: DeskReservation = {
        id: `desk-${args.office}-${args.date}-${state.deskReservations.length}`,
        officeId: args.office as OfficeId, // reference integrity checked by validate()
        date: args.date,
        name: args.name.trim(),
      };
      return { ...state, deskReservations: [...state.deskReservations, reservation] };
    }
    case "book_resource": {
      const { args } = action;
      return {
        ...state,
        resourceBookings: [
          ...state.resourceBookings,
          {
            id: `bkg-${args.resource}-${args.date}-${args.from}`,
            resourceId: args.resource as ResourceId, // reference integrity checked by validate()
            date: args.date,
            from: args.from,
            to: args.to,
            bookedBy: args.bookedBy.trim(),
            ...(args.note !== undefined && args.note !== "" ? { note: args.note } : {}),
          },
        ],
      };
    }
    case "get_team_at":
      return state; // read action, no mutation
  }
}

/* ---------- derivations ---------- */

export interface OfficeOccupancy {
  office: Office;
  planned: PlannedPerson[];
  reserved: DeskReservation[];
  byTeam: { team: string; count: number }[];
  booked: number;
  free: number;
}

/** Production getOfficeOccupancySummaryForDate(): members planned into the office that day
    (a whole-day home or leave override excludes them) plus temporary reservations. */
export function officeOccupancy(officeId: OfficeId, date: string, state: PlannerState): OfficeOccupancy {
  const office = officeById(officeId) ?? { id: officeId, name: officeId, capacity: 0 };
  const dayStart = fmt(DAY_START_MIN);
  const plannedMembers = MEMBERS.filter(
    (m) =>
      m.officeId === officeId &&
      !state.dayStatuses.some(
        (s) => s.memberId === m.id && s.date === date && s.location !== "office" && s.from === dayStart
      )
  ).map((m) => ({ name: m.name, team: teamLabelOf(m.team) }));
  const planned = [...plannedMembers, ...(OFFICE_EXTRAS[officeId][date] ?? [])];
  const reserved = state.deskReservations.filter((r) => r.officeId === officeId && r.date === date);

  const counts = new Map<string, number>();
  for (const p of planned) counts.set(p.team, (counts.get(p.team) ?? 0) + 1);
  const byTeam = [...counts.entries()].map(([team, count]) => ({ team, count }));

  const booked = planned.length + reserved.length;
  return { office, planned, reserved, byTeam, booked, free: office.capacity - booked };
}

/** Answer for the who-is-in chip; buckets every member by their segment tone at `at`
    on the given date, so it respects whichever day is selected. */
export function whoIsIn(state: PlannerState, date: string, at: string): string {
  const atMin = toMin(at);
  const buckets: Record<Tone, string[]> = { desk: [], home: [], away: [], leave: [] };
  for (const m of MEMBERS) {
    const seg = buildTimelineSegments(m.id, date, state).find((s) => s.from <= atMin && atMin < s.to);
    if (seg) buckets[seg.tone].push(m.name);
  }
  const parts: string[] = [
    buckets.desk.length > 0
      ? `in the office at ${at} on ${dayLabelOf(date)}: ${buckets.desk.join(", ")} (${buckets.desk.length} of ${MEMBERS.length})`
      : `nobody is at an office desk at ${at} on ${dayLabelOf(date)}`,
  ];
  if (buckets.away.length > 0) parts.push(`away from desk: ${buckets.away.join(", ")}`);
  if (buckets.home.length > 0) parts.push(`working from home: ${buckets.home.join(", ")}`);
  if (buckets.leave.length > 0) parts.push(`on leave: ${buckets.leave.join(", ")}`);
  return parts.join(" · ");
}

export interface Outcome {
  tone: "pos" | "neg" | "info";
  text: string;
}

/** Outcome line for a validated action, pointing at the tab where the change landed. */
export function describeOutcome(action: Action, state: PlannerState): Outcome {
  switch (action.type) {
    case "book_resource": {
      const name = resourceById(action.args.resource)?.name ?? action.args.resource;
      return {
        tone: "pos",
        text: `booked: ${name}, ${action.args.from} to ${action.args.to} on ${dayLabelOf(action.args.date)} · see the Resources tab`,
      };
    }
    case "set_day_status": {
      const member = memberById(action.args.member)?.name ?? action.args.member;
      const phrase =
        action.args.location === "home" ? "working from home" : action.args.location === "leave" ? "on leave" : "back in the office";
      const from = action.args.from ?? fmt(DAY_START_MIN);
      return {
        tone: "pos",
        text: `${member}: ${phrase} from ${from} on ${dayLabelOf(action.args.date)} · see the Team day tab`,
      };
    }
    case "get_team_at":
      return { tone: "info", text: whoIsIn(state, action.args.date, action.args.at) };
    case "reserve_desk": {
      const office = officeById(action.args.office)?.name ?? action.args.office;
      return { tone: "pos", text: `desk reserved at ${office} for ${dayLabelOf(action.args.date)} · see the Hot desks tab` };
    }
    case "add_event": {
      const member = memberById(action.args.member)?.name ?? action.args.member;
      return { tone: "pos", text: `event added for ${member}, ${action.args.from} to ${action.args.to} · see the Team day tab` };
    }
  }
}

/** Render an action the way the model emits it over MCP, for the call inspector. */
export function formatCall(action: Action): string {
  const args = Object.entries(action.args as Record<string, string | undefined>)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([k, v]) => `${k}: "${v}"`)
    .join(", ");
  return `{ tool: "${action.type}", args: { ${args} } }`;
}

/** Production teamTagClassName(): hash the team name to a stable badge tint, so the same
    team always renders the same colour without a lookup table. */
export function teamBadgeVariant(team: string): "brand" | "mint" | "neutral" {
  let h = 0;
  for (let i = 0; i < team.length; i += 1) h = (h * 31 + team.charCodeAt(i)) >>> 0;
  return (["brand", "mint", "neutral"] as const)[h % 3] ?? "neutral";
}
