export const SITE = {
  name: "Matteo Davoigneau",
  role: "Full-stack & AI engineer",
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
  { href: "#proof", label: "Live proof" },
  { href: "#work", label: "Work" },
  { href: "#ledger", label: "Ledger" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export interface Metric {
  value: string;
  label: string;
}

/** Headline numbers across the production work. */
export const METRICS: Metric[] = [
  { value: "22", label: "systems shipped solo" },
  { value: "~400", label: "hours/month recovered for their teams" },
  { value: "~A$330k", label: "saved per year by one automation" },
  { value: "~$7", label: "monthly cost to run a typical one" },
];
