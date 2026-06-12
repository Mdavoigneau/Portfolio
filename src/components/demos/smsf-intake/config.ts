/* The single typed config for the SMSF intake demo. The renderer, the
   validator, the review screen and the config viewer all walk this same
   object (after template expansion in logic.ts), mirroring the production
   architecture where one config file is the source of truth for the form,
   the validators, the review screen and the exports. */

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

/* Visibility ops, exactly the production pair: eq compares strings,
   gte parses numbers. */
export type Op = "eq" | "gte";

export interface Condition {
  field: string;
  op: Op;
  value: string | number;
}

export type Format = "email" | "phone" | "tfn" | "directorId";

export type QuestionType =
  | "short_text"
  | "email"
  | "phone"
  | "number"
  | "yes_no"
  | "single_choice"
  | "multi_choice";

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required?: boolean;
  format?: Format;
  options?: readonly string[];
  /** Resolved at expansion time from live answers. Production behaviour:
      the company secretary options are the member full names entered on
      the Your fund step. */
  optionsFrom?: "memberNames";
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
  visibleIf?: Condition | readonly Condition[];
}

export interface StepConfig {
  id: string;
  title: string;
  subtitle?: string;
  visibleIf?: Condition | readonly Condition[];
  questions: readonly Question[];
  /** Declared ONCE, expanded by logic.ts to m1_*, m2_*, ... ids for each
      active member slot (production member-templating pattern). */
  memberTemplate?: readonly Question[];
  /** Nested inside each member, expanded to m{n}_b1_*, m{n}_b2_* and gated
      on m{n}_beneficiary_add = yes and m{n}_beneficiary_count >= k. */
  beneficiaryTemplate?: readonly Question[];
  /** Shows the Add member / Remove last member controls on this step. */
  memberControls?: boolean;
}

export const MAX_MEMBER_SLOTS = 3;
export const MAX_BENEFICIARIES = 2;

/** Inside a member template condition value, this token resolves to the live
    full name of the member the question was expanded for. Used so choosing a
    company secretary reveals that member's required phone field. */
export const MEMBER_NAME_TOKEN = "@member_full_name";

export const STEPS: readonly StepConfig[] = [
  {
    id: "about-you",
    title: "About you",
    subtitle: "A few basics so your progress can be saved.",
    questions: [
      { id: "first_name", type: "short_text", label: "First name", required: true },
      { id: "family_name", type: "short_text", label: "Family name", required: true },
      {
        id: "email",
        type: "email",
        label: "Email",
        required: true,
        format: "email",
        placeholder: "you@example.com",
      },
      {
        id: "phone",
        type: "phone",
        label: "Phone",
        required: true,
        format: "phone",
        placeholder: "+61 4xx xxx xxx",
      },
    ],
  },
  {
    id: "your-fund",
    title: "Your fund",
    subtitle: "The fund you want to establish, and who its members are.",
    memberControls: true,
    questions: [
      { id: "fund_name", type: "short_text", label: "Proposed fund name", required: true },
      {
        id: "investment_mix",
        type: "multi_choice",
        label: "Intended investment mix",
        options: ["Listed shares and ETFs", "Managed funds", "Term deposits", "Property"],
      },
    ],
    memberTemplate: [
      { id: "full_name", type: "short_text", label: "Full name", required: true },
      {
        id: "tfn",
        type: "short_text",
        label: "Tax file number (TFN)",
        format: "tfn",
        placeholder: "9 digits, spaces are fine",
        help: "Optional now, but providing it avoids delays later.",
      },
      { id: "beneficiary_add", type: "yes_no", label: "Nominate death benefit beneficiaries?" },
      {
        id: "beneficiary_count",
        type: "single_choice",
        label: "How many beneficiaries?",
        required: true,
        options: ["1", "2"],
        visibleIf: { field: "beneficiary_add", op: "eq", value: "yes" },
      },
    ],
    beneficiaryTemplate: [
      { id: "name", type: "short_text", label: "Full name", required: true },
      {
        id: "relationship",
        type: "single_choice",
        label: "Relationship",
        required: true,
        options: ["Spouse", "Child", "Other"],
      },
      {
        id: "percentage",
        type: "number",
        label: "Share of benefit",
        required: true,
        min: 1,
        max: 100,
        placeholder: "0 to 100",
        help: "Shares across all beneficiaries must sum to exactly 100.",
      },
    ],
  },
  {
    id: "trustee-structure",
    title: "Trustee structure",
    subtitle: "Every fund needs a trustee. You can change your mind before submitting.",
    questions: [
      {
        id: "trustee_type",
        type: "single_choice",
        label: "How will the fund be controlled?",
        required: true,
        options: ["Individual trustees", "Corporate trustee", "Not sure yet"],
      },
    ],
  },
  {
    id: "company-details",
    title: "Company details",
    subtitle: "For the corporate trustee you are setting up.",
    visibleIf: { field: "trustee_type", op: "eq", value: "Corporate trustee" },
    questions: [
      { id: "company_name", type: "short_text", label: "Proposed company name", required: true },
      {
        id: "company_secretary",
        type: "single_choice",
        label: "Company secretary",
        required: true,
        optionsFrom: "memberNames",
        help: "Options are the member names entered on the Your fund step.",
      },
    ],
    memberTemplate: [
      {
        id: "secretary_phone",
        type: "phone",
        label: "Secretary contact phone",
        required: true,
        format: "phone",
        placeholder: "+61 4xx xxx xxx",
        visibleIf: { field: "company_secretary", op: "eq", value: MEMBER_NAME_TOKEN },
      },
      {
        id: "director_id",
        type: "short_text",
        label: "Director identification number",
        format: "directorId",
        placeholder: "15 digits",
        help: "Every director of the trustee company needs one.",
      },
    ],
  },
];

/* White-label brands (both fictional). Switching swaps CSS custom properties
   on the wrapper; everything accent-coloured reads from them. */

export interface Brand {
  id: string;
  name: string;
  /** Synthetic domain; channel mailboxes are mailbox@domain. */
  domain: string;
  accent: string;
  accent2: string;
}

export const BRANDS = [
  {
    id: "harbourline",
    name: "Harbourline Super",
    domain: "harbourline.example",
    accent: "#00786f",
    accent2: "#00665e",
  },
  {
    id: "crestpoint",
    name: "Crestpoint Wealth",
    domain: "crestpoint.example",
    accent: "#1f3a5f",
    accent2: "#c28a2c",
  },
] as const satisfies readonly Brand[];

/* Channels. Production isolates b2b and b2c at the schema level: same
   questions, different pricing, routing and contact. The figures below are
   invented round placeholders. */

export type ChannelId = "b2b" | "b2c";

export interface Channel {
  id: ChannelId;
  title: string;
  blurb: string;
  pricing: readonly { label: string; amount: string }[];
  /** Combined with the active brand domain on the success screen. */
  mailbox: string;
  phone: string;
}

export const CHANNELS = [
  {
    id: "b2b",
    title: "For advisers and businesses",
    blurb: "Wholesale establishment for clients of advice practices and accounting firms.",
    pricing: [
      { label: "Fund establishment", amount: "$900" },
      { label: "Corporate trustee setup", amount: "+$1,200" },
    ],
    mailbox: "advisers",
    phone: "1300 555 220",
  },
  {
    id: "b2c",
    title: "For individuals",
    blurb: "Set up your own fund directly, with every application reviewed by the team.",
    pricing: [
      { label: "Fund establishment", amount: "$1,100" },
      { label: "Corporate trustee setup", amount: "+$1,400" },
    ],
    mailbox: "clients",
    phone: "1300 555 110",
  },
] as const satisfies readonly Channel[];
