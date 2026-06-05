export const SITE = {
  name: "Matteo Davoigneau",
  role: "Frontend engineer for financial data",
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
  { href: "#capabilities", label: "Capabilities" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export interface Metric {
  value: string;
  label: string;
}

/** Headline numbers across the production work. */
export const METRICS: Metric[] = [
  { value: "24", label: "production systems, shipped solo" },
  { value: "~$250k", label: "staff time recovered per year" },
  { value: "~400", label: "hours saved per month" },
  { value: "~$190", label: "monthly cloud infrastructure" },
];
