import { FIRM_SYSTEMS, FIRM_TEAM_HOURS } from "@/lib/projects";

export const SITE = {
  name: "Matteo Davoigneau",
  role: "AI & software engineer",
  location: "Sydney, Australia",
  email: "matteo.davoigneau@gmail.com",
  phone: "0481 101 988",
  phoneHref: "tel:+61481101988",
  site: "davoigneau.com",
  resume: "/resume.html",
  github: "https://github.com/Mdavoigneau/Portfolio",
  linkedin: "https://www.linkedin.com/in/mdavoigneau",
} as const;

export interface NavLink {
  href: string;
  label: string;
}

export const NAV: NavLink[] = [
  { href: "#work", label: "Work" },
  { href: "#ledger", label: "Ledger" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export interface Metric {
  value: string;
  label: string;
}

/** Systems at the firm that are live, not just built. */
export const FIRM_IN_PRODUCTION = FIRM_SYSTEMS.filter((p) => p.status === "prod").length;

/** Headline numbers, computed from the ledger so they can't drift from it. */
export const METRICS: Metric[] = [
  {
    value: String(FIRM_IN_PRODUCTION),
    label: "systems put into production in six months, at one Sydney financial firm",
  },
  { value: "~30", label: "staff onboarded onto Claude, one team at a time" },
  {
    value: `~${Math.round(FIRM_TEAM_HOURS / 10) * 10}`,
    label: "hours a month given back, as reported by the teams",
  },
  { value: "~A$330k", label: "saved a year by one automation (€200k)" },
];
