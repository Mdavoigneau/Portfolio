/**
 * A faithful re-enactment of the ORIGINAL terminal tool (auto_ecologic_ecosystem.py),
 * the emergency CLI that ran the government repair-incentive claims before the web
 * app existed. Every line here is the real program's output and prompt wording,
 * captured from the source; only the case itself (person, ticket, IMEI, amounts) is
 * synthetic. One Ecologic ticket, start to finish.
 *
 * `answer` is what the operator typed at a prompt; it is "typed" on replay.
 */

export type LineKind = "cmd" | "out" | "dim" | "ok" | "prompt" | "blank";

export interface SessionLine {
  kind: LineKind;
  text: string;
  /** operator keystrokes at a prompt (rendered after the prompt, typed live) */
  answer?: string;
}

const SEP = "=".repeat(80);

export const SESSION: SessionLine[] = [
  { kind: "cmd", text: "python auto_ecologic_ecosystem.py" },
  { kind: "dim", text: "Mode: both providers" },
  { kind: "dim", text: "Ecologic rows: 1" },
  { kind: "blank", text: "" },

  { kind: "dim", text: SEP },
  { kind: "out", text: "Ticket: #10319 (id 83110)" },
  { kind: "out", text: "- Consommateur:" },
  { kind: "out", text: "  Hugo Mercier | Email: hugo.mercier@example.fr | Tel: +33 6 78 90 12 34" },
  { kind: "out", text: "  75011 Paris" },
  { kind: "out", text: "- Détail:" },
  { kind: "out", text: "  Nature: Téléphone portable - Apple - iPhone 12 - Écran cassé" },
  { kind: "out", text: "  Date intervention: 2025-06-18" },
  { kind: "out", text: "  IMEI: (sera demandé après sélection/preview des photos)" },
  { kind: "out", text: "- Montants:" },
  { kind: "out", text: "  Labor TTC 40%: 36,00 € | Parts TTC 60%: 54,00 €" },
  { kind: "out", text: "  Total HT: 75,00 € | TVA: 15,00 € | TTC: 90,00 €" },
  { kind: "out", text: "  Avance: -65,00 € | Bonus: -25,00 €" },
  { kind: "dim", text: SEP },
  { kind: "prompt", text: "[G]enerate / [E]dit fields / [S]kip ? ", answer: "g" },
  { kind: "blank", text: "" },

  { kind: "out", text: "Select the PLAQUE SIGNALÉTIQUE (IMEI - NAMEPLATE):" },
  { kind: "out", text: "  1) IMG_4821.jpg  [image/jpeg]  (modified 2025-06-18 09:14:07)  id=1a2B9x  [default]" },
  { kind: "out", text: "  2) plaque_iphone12.jpg  [image/jpeg]  (modified 2025-06-18 09:13:55)  id=7h8K1q" },
  { kind: "dim", text: "  3) →  More results…" },
  { kind: "prompt", text: "Choose 1–3 (Enter=1, →=More, ←=Prev, q=cancel): ", answer: "2" },
  { kind: "blank", text: "" },

  { kind: "out", text: "Select the VALIDATION MANUELLE (BI - CONSUMERVALIDATION):" },
  { kind: "out", text: "  1) BI_mercier_signe.jpg  [image/jpeg]  (modified 2025-06-18 09:15:22)  id=3c4D2w  [default]" },
  { kind: "out", text: "  2) ticket_caisse.jpg  [image/jpeg]  (modified 2025-06-18 09:12:40)  id=9m0N7p" },
  { kind: "prompt", text: "Choose 1–2 (Enter=1, q=cancel): ", answer: "1" },
  { kind: "blank", text: "" },

  { kind: "dim", text: "Opening previews… (nameplate, BI)" },
  { kind: "prompt", text: "Enter IMEI from NAMEPLATE (15 digits) [none]: ", answer: "353915071234567" },
  { kind: "blank", text: "" },

  { kind: "ok", text: "✔ Brand auto-detected from column D: Apple (id 17)" },
  { kind: "blank", text: "" },
  { kind: "out", text: "Choose product type:" },
  { kind: "out", text: "  1) Téléphone portable  (P10)  [default]" },
  { kind: "out", text: "  2) Tablette tactile  (P12)" },
  { kind: "out", text: "  3) Ordinateur portable  (P14)" },
  { kind: "prompt", text: "Choose 1–3 (Enter=1, q=cancel): ", answer: "1" },
  { kind: "blank", text: "" },

  { kind: "out", text: "Choose IRIS (repair) code for: Téléphone portable" },
  { kind: "out", text: "  1) 07 : Écran / affichage  [default]" },
  { kind: "out", text: "  2) 12 : Batterie / autonomie" },
  { kind: "out", text: "  3) 19 : Connectique / charge" },
  { kind: "prompt", text: "Choose 1–3 (Enter=1, q=cancel): ", answer: "1" },
  { kind: "blank", text: "" },

  { kind: "ok", text: "Selected → Brand: Apple (17) | Product: Téléphone portable (P10) | IRIS: 07" },
  { kind: "dim", text: "Ecologic: using RepairSiteId 4821" },
  { kind: "out", text: "Ecologic support TTC = 25.00 € (EcoOrg=2)" },
  { kind: "out", text: "→ Montant du soutien TTC fixé à 25.00 €" },
  { kind: "out", text: "Ecologic CreateClaim HTTP=200, ClaimId=4487102" },
  { kind: "ok", text: "SubmitClaim HTTP=200 → ok" },
  { kind: "ok", text: "Claim #4487102 status: Soumis" },
  { kind: "dim", text: "Ecosystem rows: 0" },
  { kind: "cmd", text: "" },
];
