/**
 * Synthetic Flipfinder universe: brands, models, listed configurations and
 * their 30-day daily price series. Everything is generated from a seeded PRNG
 * at module scope, so the demo is deterministic: same numbers on every load,
 * no Math.random() at render. All prices are synthetic EUR.
 *
 * The fixed synthetic "today" is Thu 12 Jun 2026; each series covers the
 * 30 days ending then, so "since yesterday" means Wed 11 Jun to Thu 12 Jun.
 */

export type BrandCode = "APL" | "SAM";
export type GradeCode = "GOOD" | "VERY_GOOD" | "EXCELLENT";

export const STORAGES = [128, 256] as const;
export type Storage = (typeof STORAGES)[number];

/** Subset of the production grade ladder, kept in the production sort order. */
export const GRADES: ReadonlyArray<{ code: GradeCode; label: string }> = [
  { code: "GOOD", label: "Good" },
  { code: "VERY_GOOD", label: "Very good" },
  { code: "EXCELLENT", label: "Excellent" },
];

export interface Colour {
  code: string;
  name: string;
}

export interface PhoneModel {
  brand: BrandCode;
  code: string;
  name: string;
  /** baseline winner price for a 128 GB Good unit, EUR */
  baseEur: number;
  colours: ReadonlyArray<Colour>;
}

export const BRANDS: ReadonlyArray<{ code: BrandCode; name: string }> = [
  { code: "APL", name: "Apple" },
  { code: "SAM", name: "Samsung" },
];

export const MODELS: ReadonlyArray<PhoneModel> = [
  {
    brand: "APL",
    code: "IP13",
    name: "iPhone 13",
    baseEur: 452,
    colours: [
      { code: "MID", name: "Midnight" },
      { code: "STR", name: "Starlight" },
      { code: "BLU", name: "Blue" },
    ],
  },
  {
    brand: "APL",
    code: "IP12",
    name: "iPhone 12",
    baseEur: 348,
    colours: [
      { code: "BLK", name: "Black" },
      { code: "WHT", name: "White" },
    ],
  },
  {
    brand: "SAM",
    code: "GS22",
    name: "Galaxy S22",
    baseEur: 392,
    colours: [
      { code: "PBK", name: "Phantom Black" },
      { code: "GRN", name: "Green" },
    ],
  },
];

/** One day of auction prices for a configuration. */
export interface PricePoint {
  day: number;
  label: string;
  /** lowest bid that would have won the day, EUR */
  ptw: number;
  /** the price that actually won, EUR */
  winner: number;
}

/** One concrete storage, grade, colour choice on the model-details screen. */
export interface Selection {
  storage: Storage;
  grade: GradeCode;
  colour: string;
}

/** A listed configuration (one SKU) with its 30-day daily price series. */
export interface Combo extends Selection {
  id: string;
  modelCode: string;
  series: ReadonlyArray<PricePoint>;
}

/**
 * Combinations with no listings on the marketplace. The production smart
 * filter disables exactly these: options whose remaining combinations are
 * empty. Kept deliberately uneven so each model disables differently.
 */
const ABSENT: ReadonlySet<string> = new Set([
  "IP13|128|EXCELLENT|MID",
  "IP13|128|EXCELLENT|STR",
  "IP13|128|EXCELLENT|BLU",
  "IP13|256|GOOD|BLU",
  "IP12|256|EXCELLENT|WHT",
  "GS22|128|GOOD|GRN",
]);

/* ------------------------------- generation ------------------------------- */

// 30 day labels ending on the page's fixed synthetic "today", Thu 12 Jun.
const DAY_LABELS: ReadonlyArray<string> = [
  ...Array.from({ length: 18 }, (_, i) => `${i + 14} May`),
  ...Array.from({ length: 12 }, (_, i) => `${i + 1} Jun`),
];

/** Deterministic PRNG, same generator the v1 miniature shipped with. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash: gives every combo id its own stable PRNG seed. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

const GRADE_BUMP: Readonly<Record<GradeCode, number>> = {
  GOOD: 0,
  VERY_GOOD: 38,
  EXCELLENT: 86,
};
const STORAGE_BUMP = 58; // 256 GB over 128 GB, EUR

function buildSeries(rand: () => number, base: number, drift: number): PricePoint[] {
  const pts: PricePoint[] = [];
  for (let i = 0; i < DAY_LABELS.length; i++) {
    const winner = round2(base + drift * i + (rand() - 0.5) * 14);
    const gap = 9 + rand() * 9;
    pts.push({ day: i, label: DAY_LABELS[i] ?? "", ptw: round2(winner - gap), winner });
  }
  return pts;
}

/** Every listed configuration across all models. Built once at module scope. */
export const UNIVERSE: ReadonlyArray<Combo> = (() => {
  const out: Combo[] = [];
  for (const model of MODELS) {
    for (const storage of STORAGES) {
      for (const grade of GRADES) {
        for (const colour of model.colours) {
          const id = `${model.code}|${storage}|${grade.code}|${colour.code}`;
          if (ABSENT.has(id)) continue;
          const rand = mulberry32(hashSeed(id));
          const base =
            model.baseEur +
            (storage === 256 ? STORAGE_BUMP : 0) +
            GRADE_BUMP[grade.code] +
            (rand() - 0.5) * 18;
          const drift = (rand() - 0.5) * 3.2; // EUR per day, so movers differ per combo
          out.push({
            id,
            modelCode: model.code,
            storage,
            grade: grade.code,
            colour: colour.code,
            series: buildSeries(rand, base, drift),
          });
        }
      }
    }
  }
  return out;
})();

/* -------------------------------- dictionary ------------------------------- */

export function modelByCode(code: string): PhoneModel | undefined {
  return MODELS.find((m) => m.code === code);
}

export function brandName(code: BrandCode): string {
  return BRANDS.find((b) => b.code === code)?.name ?? code;
}

export function gradeLabel(code: GradeCode): string {
  return GRADES.find((g) => g.code === code)?.label ?? code;
}

export function colourName(modelCode: string, colourCode: string): string {
  return modelByCode(modelCode)?.colours.find((c) => c.code === colourCode)?.name ?? colourCode;
}

/** Production SKU shape (prefix, brand, model, colour, storage, grade). */
export function skuFor(modelCode: string, s: Selection): string {
  const brand = modelByCode(modelCode)?.brand ?? "";
  return `FF-${brand}-${modelCode}-${s.colour}-${s.storage}-${s.grade}`;
}
