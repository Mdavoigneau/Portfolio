/* Pure config walkers for the SMSF intake demo. No React. Every exported
   function mirrors a named production behaviour; the renderer, the validator
   and the review screen all walk the same expanded question list these
   functions produce, so the surfaces cannot drift. */

import {
  MAX_BENEFICIARIES,
  MAX_MEMBER_SLOTS,
  MEMBER_NAME_TOKEN,
  type Answers,
  type AnswerValue,
  type Condition,
  type Format,
  type Question,
  type StepConfig,
} from "./config";

/** A question after template expansion: a concrete id (m2_b1_percentage)
    plus the provenance tags the renderer and review screen group by. */
export interface ExpandedQuestion extends Omit<Question, "visibleIf" | "optionsFrom"> {
  visibleIf?: readonly Condition[];
  /** 1-based member slot this question was expanded for. */
  member?: number;
  /** 1-based beneficiary index within the member. */
  beneficiary?: number;
}

function asString(v: AnswerValue | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.join(", ");
  return "";
}

export function isBlank(v: AnswerValue | undefined): boolean {
  if (v === undefined) return true;
  return typeof v === "string" ? v.trim() === "" : v.length === 0;
}

/** Active member slots, clamped to 1..MAX_MEMBER_SLOTS. Production keeps the
    same counter in answers.member_slots and filters m{n}_* questions to it. */
export function memberSlots(answers: Answers): number {
  const n = Math.trunc(Number(asString(answers["member_slots"]) || "1"));
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_MEMBER_SLOTS) : 1;
}

/** visibleIf gate with the production ops: eq compares strings, gte parses
    numbers (NaN never passes). ALL conditions must hold. */
export function isVisible(
  conds: Condition | readonly Condition[] | undefined,
  answers: Answers
): boolean {
  if (!conds) return true;
  const list = Array.isArray(conds) ? conds : [conds];
  return list.every((c) => {
    const got = asString(answers[c.field]).trim();
    if (c.op === "eq") return got === String(c.value);
    const n = Number(got);
    return got !== "" && Number.isFinite(n) && n >= Number(c.value);
  });
}

export function memberName(n: number, answers: Answers): string {
  return asString(answers[`m${n}_full_name`]).trim();
}

/** Production behaviour: the company secretary single_choice is populated
    from the live member full names entered on the previous step. */
export function memberNameOptions(slots: number, answers: Answers): string[] {
  const names: string[] = [];
  for (let n = 1; n <= slots; n++) {
    const name = memberName(n, answers);
    if (name !== "") names.push(name);
  }
  return names;
}

/* Expansion internals. Template conditions may reference sibling template
   questions by their local id (prefixed during expansion) or any absolute
   field id (left untouched). MEMBER_NAME_TOKEN values resolve to the live
   member name, or to a sentinel that can never match while it is unset. */

function expandConditions(
  conds: Condition | readonly Condition[] | undefined,
  prefix: string,
  localIds: ReadonlySet<string>,
  name: string
): Condition[] {
  if (!conds) return [];
  const list = Array.isArray(conds) ? conds : [conds];
  return list.map((c) => ({
    field: localIds.has(c.field) ? prefix + c.field : c.field,
    op: c.op,
    value: c.value === MEMBER_NAME_TOKEN ? name || "@unresolved" : c.value,
  }));
}

function build(
  base: Question,
  id: string,
  conds: readonly Condition[],
  options: readonly string[] | undefined,
  member?: number,
  beneficiary?: number
): ExpandedQuestion {
  const out: ExpandedQuestion = { id, type: base.type, label: base.label };
  if (base.required) out.required = true;
  if (base.format) out.format = base.format;
  if (options) out.options = options;
  if (base.placeholder !== undefined) out.placeholder = base.placeholder;
  if (base.help !== undefined) out.help = base.help;
  if (base.min !== undefined) out.min = base.min;
  if (base.max !== undefined) out.max = base.max;
  if (conds.length > 0) out.visibleIf = conds;
  if (member !== undefined) out.member = member;
  if (beneficiary !== undefined) out.beneficiary = beneficiary;
  return out;
}

/** The production member-templating pattern: step questions pass through,
    then the member template is expanded once per active slot to m{n}_* ids,
    with its beneficiary template nested as m{n}_b{k}_* gated on the member
    nominating beneficiaries and the count reaching k. */
export function expandStep(step: StepConfig, slots: number, answers: Answers): ExpandedQuestion[] {
  const out: ExpandedQuestion[] = [];
  const noIds = new Set<string>();

  for (const q of step.questions) {
    const options = q.optionsFrom === "memberNames" ? memberNameOptions(slots, answers) : q.options;
    out.push(build(q, q.id, expandConditions(q.visibleIf, "", noIds, ""), options));
  }

  const mt = step.memberTemplate ?? [];
  const bt = step.beneficiaryTemplate ?? [];
  const mIds = new Set(mt.map((q) => q.id));
  const bIds = new Set(bt.map((q) => q.id));

  for (let n = 1; n <= slots; n++) {
    const mPrefix = `m${n}_`;
    const name = memberName(n, answers);
    for (const q of mt) {
      const conds = expandConditions(q.visibleIf, mPrefix, mIds, name);
      out.push(build(q, mPrefix + q.id, conds, q.options, n));
    }
    if (bt.length === 0) continue;
    for (let k = 1; k <= MAX_BENEFICIARIES; k++) {
      const bPrefix = `${mPrefix}b${k}_`;
      const gates: Condition[] = [
        { field: `${mPrefix}beneficiary_add`, op: "eq", value: "yes" },
        { field: `${mPrefix}beneficiary_count`, op: "gte", value: k },
      ];
      for (const q of bt) {
        const conds = [...gates, ...expandConditions(q.visibleIf, bPrefix, bIds, name)];
        out.push(build(q, bPrefix + q.id, conds, q.options, n, k));
      }
    }
  }
  return out;
}

export function visibleStepsOf(steps: readonly StepConfig[], answers: Answers): StepConfig[] {
  return steps.filter((s) => isVisible(s.visibleIf, answers));
}

/* Per-question validation. Formats match production: TFN exactly 9 digits,
   director ID exactly 15 digits (spaces stripped for both), phone 8 to 12
   digits with an optional leading +. */

export function formatErrorFor(format: Format, raw: string): string | null {
  if (format === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim()) ? null : "enter a valid email address";
  }
  const digits = raw.replace(/\s+/g, "");
  if (format === "phone") {
    return /^\+?\d{8,12}$/.test(digits) ? null : "enter a valid phone number (8 to 12 digits)";
  }
  if (format === "tfn") {
    return /^\d{9}$/.test(digits) ? null : "a TFN is exactly 9 digits (spaces are fine)";
  }
  return /^\d{15}$/.test(digits) ? null : "a director ID is exactly 15 digits";
}

function numberError(q: ExpandedQuestion, raw: string): string | null {
  const n = Number(raw.trim());
  if (!Number.isInteger(n)) return "enter a whole number";
  if (q.min !== undefined && n < q.min) return `must be at least ${q.min}`;
  if (q.max !== undefined && n > q.max) return `must be ${q.max} or less`;
  return null;
}

/** Step validation over the expanded list: required and format checks per
    visible question, then the production cross-field rule: for each member
    with beneficiaries nominated, the shares must sum to EXACTLY 100, with
    the error attached to the LAST beneficiary's percentage field. */
export function validateStep(
  expanded: readonly ExpandedQuestion[],
  answers: Answers
): Record<string, string> {
  const errors: Record<string, string> = {};
  const visible = expanded.filter((q) => isVisible(q.visibleIf, answers));

  for (const q of visible) {
    const raw = answers[q.id];
    if (q.required && isBlank(raw)) {
      errors[q.id] = "required";
      continue;
    }
    if (isBlank(raw) || typeof raw !== "string") continue;
    if (q.format) {
      const err = formatErrorFor(q.format, raw);
      if (err) {
        errors[q.id] = err;
        continue;
      }
    }
    if (q.type === "number") {
      const err = numberError(q, raw);
      if (err) errors[q.id] = err;
    }
    // Reference integrity for resolved option lists: a single_choice answer
    // can go stale when its source changes (e.g. the chosen company secretary
    // is removed or renamed on the Your fund step). Production re-resolves
    // options from live answers the same way, so a stale pick must re-block.
    if (q.type === "single_choice" && q.options && !q.options.includes(raw)) {
      errors[q.id] = "choose one of the listed options";
    }
  }

  // Cross-field check runs after per-question validation (production order);
  // skipped for a member while any of their share fields has its own error.
  const byMember = new Map<number, ExpandedQuestion[]>();
  for (const q of visible) {
    if (q.member === undefined || q.beneficiary === undefined) continue;
    if (!q.id.endsWith("_percentage")) continue;
    const list = byMember.get(q.member) ?? [];
    list.push(q);
    byMember.set(q.member, list);
  }
  for (const fields of byMember.values()) {
    if (fields.some((f) => errors[f.id] !== undefined)) continue;
    const sum = fields.reduce((acc, f) => acc + Number(asString(answers[f.id]).trim()), 0);
    const last = fields[fields.length - 1];
    if (sum !== 100 && last) {
      errors[last.id] = `beneficiary shares must sum to 100 (currently ${sum})`;
    }
  }
  return errors;
}

/** Production soft-warning aggregation: blank optional TFNs (Your fund) and
    blank director IDs (Company details) do not fail validation, but the
    first Next is blocked with a notice listing the members affected; an
    acknowledge checkbox lets the second Next proceed. */
export function softWarningFor(
  expanded: readonly ExpandedQuestion[],
  answers: Answers
): string | null {
  const blanks = (format: Format) =>
    expanded.filter(
      (q) =>
        q.format === format && !q.required && isVisible(q.visibleIf, answers) && isBlank(answers[q.id])
    );
  const tfn = blanks("tfn");
  if (tfn.length > 0) {
    return `No TFN entered for ${listMembers(tfn, answers)}. TFNs are optional now, but providing them avoids delays with the regulator later.`;
  }
  const dir = blanks("directorId");
  if (dir.length > 0) {
    return `No director ID entered for ${listMembers(dir, answers)}. Every director of the trustee company needs one before registration.`;
  }
  return null;
}

function listMembers(qs: readonly ExpandedQuestion[], answers: Answers): string {
  return qs
    .map((q) => {
      const n = q.member ?? 0;
      const name = memberName(n, answers);
      return name === "" ? `Member ${n}` : `Member ${n} (${name})`;
    })
    .join(", ");
}

/** Member 1 prefills from About you when first reaching Your fund, and stays
    editable (production prefill). No-op once a name exists. */
export function withMemberOnePrefill(answers: Answers): Answers {
  const full = [asString(answers["first_name"]).trim(), asString(answers["family_name"]).trim()]
    .filter(Boolean)
    .join(" ");
  if (full === "" || !isBlank(answers["m1_full_name"])) return answers;
  return { ...answers, m1_full_name: full };
}

/** Removing the last member clears every m{n}_* answer for that slot,
    including nested b{k}_* beneficiary answers (production behaviour). */
export function withoutMemberAnswers(answers: Answers, slot: number): Answers {
  const prefix = `m${slot}_`;
  const next: Answers = {};
  for (const [key, value] of Object.entries(answers)) {
    if (!key.startsWith(prefix)) next[key] = value;
  }
  return next;
}

/** Review formatting: arrays as comma lists, yes/no as Yes/No, percentage
    shares with a % suffix, blanks as null (rendered "not provided"). */
export function formatAnswer(q: ExpandedQuestion, v: AnswerValue | undefined): string | null {
  if (v === undefined || isBlank(v)) return null;
  if (Array.isArray(v)) return v.join(", ");
  if (q.type === "yes_no") return v === "yes" ? "Yes" : "No";
  if (q.type === "number" && q.id.endsWith("_percentage")) return `${v.trim()}%`;
  return v;
}

/** Figures and ids render in tabular mono on the review screen. */
export function isMonoAnswer(q: ExpandedQuestion): boolean {
  return q.format === "tfn" || q.format === "directorId" || q.type === "number";
}
