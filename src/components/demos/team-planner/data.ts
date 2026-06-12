/* Team Planner domain types and the synthetic dataset.
   Three planning days around a fixed synthetic "today" (Thu 12 Jun 2026, clock 11:20).
   Every name, office and booking is invented; production runs the same shapes for a
   40+ person firm at a financial institution. */

export type TeamId = "advice" | "operations" | "technology";
export type OfficeId = "off-syd" | "off-mel";
export type ResourceId = "boardroom-a" | "focus-pod-2";

/** Where a member's base day happens; production also scopes office::id. */
export type LocationId = "office" | "home" | "leave";
/** Intraday event kinds; production calls these statuses (desk / away / leave). */
export type EventKind = "desk" | "away" | "leave";
export type AwayTypeId = "lunch" | "break" | "personal" | "offsite";

/** Visual tone of a timeline segment; production derives it via stateTone(location, status). */
export type Tone = "desk" | "home" | "away" | "leave";

/* Working window and the fixed demo clock. */
export const DAY_START_MIN = 8 * 60; // 08:00
export const DAY_END_MIN = 18 * 60; // 18:00
export const NOW_MIN = 11 * 60 + 20; // 11:20, only drawn on the synthetic today
export const NOTE_MAX = 100;

export interface PlanningDay {
  iso: string;
  label: string;
  isToday: boolean;
}

const WED: PlanningDay = { iso: "2026-06-11", label: "Wed 11 Jun", isToday: false };
const THU: PlanningDay = { iso: "2026-06-12", label: "Thu 12 Jun", isToday: true };
const FRI: PlanningDay = { iso: "2026-06-13", label: "Fri 13 Jun", isToday: false };

export const DAYS: readonly PlanningDay[] = [WED, THU, FRI];
export const TODAY = THU;
export const TODAY_INDEX = 1;

export function dayAt(index: number): PlanningDay {
  return DAYS[index] ?? TODAY;
}

export const TEAMS: readonly { id: TeamId; label: string }[] = [
  { id: "advice", label: "Advice" },
  { id: "operations", label: "Operations" },
  { id: "technology", label: "Technology" },
];

export interface Member {
  id: string;
  name: string;
  team: TeamId;
  /** Office whose hot desks this member counts against when planned in. */
  officeId: OfficeId;
}

export const MEMBERS: readonly Member[] = [
  { id: "priya", name: "Priya Sharma", team: "advice", officeId: "off-syd" },
  { id: "tom", name: "Tom Becker", team: "advice", officeId: "off-syd" },
  { id: "mei", name: "Mei Lin", team: "operations", officeId: "off-syd" },
  { id: "jack", name: "Jack Doyle", team: "operations", officeId: "off-syd" },
  { id: "noor", name: "Noor Haddad", team: "technology", officeId: "off-syd" },
  { id: "dmitri", name: "Dmitri Volkov", team: "technology", officeId: "off-mel" },
];

export interface Office {
  id: OfficeId;
  name: string;
  capacity: number;
}

export const OFFICES: readonly Office[] = [
  { id: "off-syd", name: "Sydney HQ", capacity: 12 },
  { id: "off-mel", name: "Melbourne", capacity: 8 },
];

export interface Resource {
  id: ResourceId;
  name: string;
}

export const RESOURCES: readonly Resource[] = [
  { id: "boardroom-a", name: "Boardroom A" },
  { id: "focus-pod-2", name: "Focus Pod 2" },
];

export const AWAY_TYPES: readonly { id: AwayTypeId; label: string }[] = [
  { id: "lunch", label: "Lunch" },
  { id: "break", label: "Break" },
  { id: "personal", label: "Personal" },
  { id: "offsite", label: "Off-site" },
];

/** A timed block overlaid on a member's base day; never overlaps another event. */
export interface IntradayEvent {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  from: string; // HH:mm
  to: string; // HH:mm
  kind: EventKind;
  awayType?: AwayTypeId; // required when kind is "away" (enforced by the validator)
  label?: string; // bar label override; seed data only, the form never sets it
  note?: string; // <= NOTE_MAX chars (enforced by the validator)
}

/** Switches a member's base location from a time onwards ("08:00" means the whole day). */
export interface DayStatusOverride {
  id: string;
  memberId: string;
  date: string;
  location: LocationId;
  from: string; // HH:mm
  label?: string; // e.g. "Annual leave"; defaults per location
  note?: string;
}

export interface DeskReservation {
  id: string;
  officeId: OfficeId;
  date: string;
  name: string;
}

export interface ResourceBooking {
  id: string;
  resourceId: ResourceId;
  date: string;
  from: string;
  to: string;
  bookedBy: string;
  note?: string;
  /** Set when the booking landed through the plain-English panel. */
  viaChip?: boolean;
}

export interface PlannerState {
  events: IntradayEvent[];
  dayStatuses: DayStatusOverride[];
  deskReservations: DeskReservation[];
  resourceBookings: ResourceBooking[];
}

/** The rest of the firm's planned office attendance. Production derives this from each
    member's weeklyWorkLocation; the miniature lists the non-timeline people per day. */
export interface PlannedPerson {
  name: string;
  team: string;
}

export const OFFICE_EXTRAS: Record<OfficeId, Record<string, readonly PlannedPerson[]>> = {
  "off-syd": {
    [WED.iso]: [
      { name: "Hugo Fontaine", team: "Finance" },
      { name: "Anneke Visser", team: "Advice" },
      { name: "Rafael Ortiz", team: "Operations" },
      { name: "Bianca Russo", team: "Finance" },
    ],
    [THU.iso]: [
      { name: "Hugo Fontaine", team: "Finance" },
      { name: "Anneke Visser", team: "Advice" },
      { name: "Rafael Ortiz", team: "Operations" },
      { name: "Bianca Russo", team: "Finance" },
      { name: "Theo Lindqvist", team: "Technology" },
    ],
    [FRI.iso]: [
      { name: "Hugo Fontaine", team: "Finance" },
      { name: "Anneke Visser", team: "Advice" },
      { name: "Theo Lindqvist", team: "Technology" },
    ],
  },
  "off-mel": {
    [WED.iso]: [
      { name: "Keiko Tanaka", team: "Operations" },
      { name: "Lars Eriksen", team: "Technology" },
      { name: "Paloma Duarte", team: "Advice" },
    ],
    [THU.iso]: [
      { name: "Keiko Tanaka", team: "Operations" },
      { name: "Lars Eriksen", team: "Technology" },
      { name: "Paloma Duarte", team: "Advice" },
      { name: "Miriam Osei", team: "Finance" },
      { name: "Connor Walsh", team: "Operations" },
    ],
    [FRI.iso]: [
      { name: "Keiko Tanaka", team: "Operations" },
      { name: "Miriam Osei", team: "Finance" },
    ],
  },
};

/* Seed state. Thursday is rich, Wednesday and Friday lighter; Tom's annual leave spans
   all three days. Members without an override default to office desk for the day. */
export const INITIAL_STATE: PlannerState = {
  dayStatuses: [
    { id: "ds-tom-w", memberId: "tom", date: WED.iso, location: "leave", from: "08:00", label: "Annual leave", note: "Back Monday 16 Jun" },
    { id: "ds-tom-t", memberId: "tom", date: THU.iso, location: "leave", from: "08:00", label: "Annual leave", note: "Back Monday 16 Jun" },
    { id: "ds-tom-f", memberId: "tom", date: FRI.iso, location: "leave", from: "08:00", label: "Annual leave", note: "Back Monday 16 Jun" },
    { id: "ds-noor-w", memberId: "noor", date: WED.iso, location: "home", from: "08:00" },
    { id: "ds-mei-f", memberId: "mei", date: FRI.iso, location: "home", from: "08:00" },
  ],
  events: [
    // Thursday (today), as the first version of this demo
    { id: "evt-t-priya-1", memberId: "priya", date: THU.iso, from: "10:00", to: "11:00", kind: "away", awayType: "offsite", label: "Client call", note: "Quarterly review, dial-in" },
    { id: "evt-t-priya-2", memberId: "priya", date: THU.iso, from: "12:30", to: "13:15", kind: "away", awayType: "lunch" },
    { id: "evt-t-mei-1", memberId: "mei", date: THU.iso, from: "12:00", to: "12:45", kind: "away", awayType: "lunch" },
    { id: "evt-t-jack-1", memberId: "jack", date: THU.iso, from: "09:30", to: "10:30", kind: "away", awayType: "offsite", note: "Supplier visit, level 3 fit-out" },
    { id: "evt-t-jack-2", memberId: "jack", date: THU.iso, from: "13:00", to: "13:45", kind: "away", awayType: "lunch" },
    { id: "evt-t-noor-1", memberId: "noor", date: THU.iso, from: "12:00", to: "12:30", kind: "away", awayType: "lunch" },
    { id: "evt-t-noor-2", memberId: "noor", date: THU.iso, from: "14:00", to: "15:30", kind: "desk", label: "Deploy window", note: "Release 2.11 to staging" },
    { id: "evt-t-dmitri-1", memberId: "dmitri", date: THU.iso, from: "12:45", to: "13:30", kind: "away", awayType: "lunch" },
    { id: "evt-t-dmitri-2", memberId: "dmitri", date: THU.iso, from: "16:00", to: "17:00", kind: "away", awayType: "personal", note: "School pickup" },
    // Wednesday, lighter
    { id: "evt-w-priya-1", memberId: "priya", date: WED.iso, from: "12:30", to: "13:15", kind: "away", awayType: "lunch" },
    { id: "evt-w-mei-1", memberId: "mei", date: WED.iso, from: "13:00", to: "13:30", kind: "away", awayType: "lunch" },
    { id: "evt-w-jack-1", memberId: "jack", date: WED.iso, from: "12:00", to: "12:45", kind: "away", awayType: "lunch" },
    { id: "evt-w-dmitri-1", memberId: "dmitri", date: WED.iso, from: "14:00", to: "16:00", kind: "away", awayType: "offsite", note: "Data centre visit" },
    // Friday, lighter
    { id: "evt-f-priya-1", memberId: "priya", date: FRI.iso, from: "10:00", to: "10:15", kind: "away", awayType: "break" },
    { id: "evt-f-mei-1", memberId: "mei", date: FRI.iso, from: "12:30", to: "13:00", kind: "away", awayType: "lunch" },
    { id: "evt-f-jack-1", memberId: "jack", date: FRI.iso, from: "12:30", to: "13:15", kind: "away", awayType: "lunch" },
    { id: "evt-f-noor-1", memberId: "noor", date: FRI.iso, from: "12:00", to: "12:45", kind: "away", awayType: "lunch" },
    { id: "evt-f-dmitri-1", memberId: "dmitri", date: FRI.iso, from: "12:00", to: "12:30", kind: "away", awayType: "lunch" },
  ],
  deskReservations: [
    { id: "desk-syd-1", officeId: "off-syd", date: THU.iso, name: "Sasha Moreau (contractor)" },
    { id: "desk-mel-1", officeId: "off-mel", date: THU.iso, name: "Janek Kowalski (visitor)" },
  ],
  resourceBookings: [
    { id: "rb-1", resourceId: "boardroom-a", date: THU.iso, from: "09:00", to: "09:45", bookedBy: "Priya Sharma", note: "Advice stand-up" },
    { id: "rb-2", resourceId: "boardroom-a", date: THU.iso, from: "12:30", to: "13:30", bookedBy: "Jack Doyle", note: "Vendor walkthrough" },
    { id: "rb-3", resourceId: "focus-pod-2", date: THU.iso, from: "10:00", to: "11:30", bookedBy: "Noor Haddad", note: "Design review prep" },
    { id: "rb-4", resourceId: "focus-pod-2", date: THU.iso, from: "14:00", to: "15:00", bookedBy: "Mei Lin" },
    { id: "rb-5", resourceId: "boardroom-a", date: WED.iso, from: "11:00", to: "12:00", bookedBy: "Mei Lin", note: "Ops weekly" },
    { id: "rb-6", resourceId: "focus-pod-2", date: WED.iso, from: "09:00", to: "10:00", bookedBy: "Dmitri Volkov" },
    { id: "rb-7", resourceId: "boardroom-a", date: FRI.iso, from: "15:00", to: "16:00", bookedBy: "Priya Sharma", note: "Client onboarding" },
  ],
};
