import type { JurisdictionRule } from "./types";

const reviewed = "18 September 2026";

const entries: Array<[string, string, "State" | "Union Territory", string, string]> = [
  ["ap", "Andhra Pradesh", "State", "Andhra Pradesh Court Fees and Suits Valuation Act, 1956", "South Indian valuation act"],
  ["ar", "Arunachal Pradesh", "State", "Court-fee law applicable in the State (current adaptation to be verified)", "Court Fees Act family"],
  ["as", "Assam", "State", "Court Fees Act, 1870 as amended for Assam", "Court Fees Act family"],
  ["br", "Bihar", "State", "Court Fees Act, 1870 as amended for Bihar", "Court Fees Act family"],
  ["cg", "Chhattisgarh", "State", "Court Fees Act, 1870 as adapted and amended", "Court Fees Act family"],
  ["ga", "Goa", "State", "Goa, Daman and Diu Court-fees Act, 1965, as applicable", "Goa court-fees family"],
  ["gj", "Gujarat", "State", "Bombay Court-fees Act, 1959 as adapted for Gujarat", "Bombay court-fees family"],
  ["hr", "Haryana", "State", "Court Fees Act, 1870 as amended for Haryana", "Court Fees Act family"],
  ["hp", "Himachal Pradesh", "State", "Court Fees Act, 1870 as amended for Himachal Pradesh", "Court Fees Act family"],
  ["jh", "Jharkhand", "State", "Court Fees Act, 1870 as adapted and amended", "Court Fees Act family"],
  ["ka", "Karnataka", "State", "Karnataka Court Fees and Suits Valuation Act, 1958", "Karnataka valuation act"],
  ["kl", "Kerala", "State", "Kerala Court Fees and Suits Valuation Act, 1959", "South Indian valuation act"],
  ["mp", "Madhya Pradesh", "State", "Court Fees Act, 1870 as amended for Madhya Pradesh", "Court Fees Act family"],
  ["mh", "Maharashtra", "State", "Maharashtra Court Fees Act, 1959", "Bombay court-fees family"],
  ["mn", "Manipur", "State", "Court Fees Act, 1870 as applicable and amended", "Court Fees Act family"],
  ["ml", "Meghalaya", "State", "Court Fees Act, 1870 as applicable and amended", "Court Fees Act family"],
  ["mz", "Mizoram", "State", "Court Fees Act, 1870 as applicable and amended", "Court Fees Act family"],
  ["nl", "Nagaland", "State", "Court-fee law applicable in the State (current adaptation to be verified)", "Court Fees Act family"],
  ["od", "Odisha", "State", "Court Fees Act, 1870 as amended for Odisha", "Court Fees Act family"],
  ["pb", "Punjab", "State", "Court Fees Act, 1870 as amended for Punjab", "Court Fees Act family"],
  ["rj", "Rajasthan", "State", "Rajasthan Court Fees and Suits Valuation Act, 1961", "State valuation act"],
  ["sk", "Sikkim", "State", "Court-fee rules applicable in Sikkim (current compilation to be verified)", "State rules family"],
  ["tn", "Tamil Nadu", "State", "Tamil Nadu Court Fees and Suits Valuation Act, 1955", "South Indian valuation act"],
  ["tg", "Telangana", "State", "Telangana Court Fees and Suits Valuation Act, 1956", "South Indian valuation act"],
  ["tr", "Tripura", "State", "Court Fees Act, 1870 as applicable and amended", "Court Fees Act family"],
  ["up", "Uttar Pradesh", "State", "Court Fees Act, 1870 as amended for Uttar Pradesh", "Court Fees Act family"],
  ["uk", "Uttarakhand", "State", "Court Fees Act, 1870 as adapted and amended", "Court Fees Act family"],
  ["wb", "West Bengal", "State", "West Bengal Court-fees Act, 1970", "West Bengal court-fees family"],
  ["an", "Andaman and Nicobar Islands", "Union Territory", "Court Fees Act, 1870 as applicable", "Court Fees Act family"],
  ["ch", "Chandigarh", "Union Territory", "Court Fees Act, 1870 as applicable to Chandigarh", "Court Fees Act family"],
  ["dn", "Dadra and Nagar Haveli and Daman and Diu", "Union Territory", "Applicable court-fee enactments and adaptations (consolidation to be verified)", "UT adaptation family"],
  ["dl", "Delhi", "Union Territory", "Court Fees Act, 1870 as applicable to the NCT of Delhi", "Court Fees Act family"],
  ["jk", "Jammu and Kashmir", "Union Territory", "Court-fee enactment applicable after reorganisation (current adaptation to be verified)", "UT adaptation family"],
  ["la", "Ladakh", "Union Territory", "Court-fee enactment applicable after reorganisation (current adaptation to be verified)", "UT adaptation family"],
  ["ld", "Lakshadweep", "Union Territory", "Court-fee enactment extended to the Union Territory (current adaptation to be verified)", "UT adaptation family"],
  ["py", "Puducherry", "Union Territory", "Puducherry Court Fees and Suits Valuation enactment, as applicable", "South Indian valuation act"],
];

export const JURISDICTIONS: JurisdictionRule[] = entries.map(([id, name, kind, act, actFamily]) => ({
  id,
  name,
  kind,
  act,
  actFamily,
  verification: id === "ka" ? "verified" : "framework",
  verifiedThrough: reviewed,
  notes:
    id === "ka"
      ? "Valuation sections 7 and 21–50, Schedule I Article 1, and the current ₹15 lakh Civil Judge threshold are encoded from official State compilations. Special local forums and later notifications must still be checked."
      : "Jurisdiction is selectable and the deterministic valuation framework is active. The state-specific fee schedule and court thresholds require official-source sign-off.",
  sourceUrl: id === "ka" ? "https://dpal.karnataka.gov.in/storage/pdf-files/acts%20alpha%20and%20dept%20wise%20acts/16%20of%201958%20%28E%29.pdf" : undefined,
  pecuniaryBands:
    id === "ka"
      ? [
          { max: 1_500_000, court: "Civil Judge having territorial competence" },
          { max: null, court: "Senior Civil Judge having territorial competence" },
        ]
      : id === "dl"
      ? [
          { max: 300000, court: "Civil Judge, competent Delhi district" },
          { max: 20000000, court: "District Judge / competent District Court, Delhi" },
          { max: null, court: "High Court of Delhi — ordinary original civil jurisdiction" },
        ]
      : undefined,
}));

export const JURISDICTION_BY_ID = Object.fromEntries(JURISDICTIONS.map((item) => [item.id, item]));

export const SUIT_TYPES = [
  { id: "money_recovery", label: "Money recovery" },
  { id: "damages", label: "Damages or compensation" },
  { id: "specific_performance", label: "Specific performance" },
  { id: "declaration_only", label: "Declaration only" },
  { id: "declaration_consequential", label: "Declaration with consequential relief" },
  { id: "injunction", label: "Permanent / mandatory injunction" },
  { id: "possession", label: "Possession of immovable property" },
  { id: "partition", label: "Partition and separate possession" },
  { id: "landlord_tenant", label: "Landlord–tenant / possession" },
  { id: "accounts", label: "Rendition of accounts" },
  { id: "mortgage", label: "Mortgage / secured debt" },
  { id: "administration", label: "Administration of estate" },
  { id: "appeal", label: "Appeal (valuation carried forward)" },
  { id: "maintenance", label: "Maintenance / periodic payment" },
  { id: "movable_property", label: "Movable property" },
  { id: "easement", label: "Easement" },
  { id: "preemption", label: "Pre-emption" },
  { id: "cancellation", label: "Cancellation of decree / document" },
  { id: "mesne_profits", label: "Mesne profits" },
  { id: "set_aside_attachment", label: "Set aside attachment" },
  { id: "revenue_register", label: "Alteration of revenue register" },
  { id: "public_matter", label: "Public matter / public trust" },
  { id: "other", label: "Other relief not specifically provided" },
] as const;
