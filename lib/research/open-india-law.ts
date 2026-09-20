/* ── OpenIndiaLaw Data Adapter ─────────────────────────────────────
 *
 * Connects to the OpenIndiaLaw dataset (12.8M judgments, 22K+ Acts)
 * via the Vaquill public mirror or a self-hosted Qdrant instance.
 *
 * Schema reference: open-india-law-main/README.md
 *
 * To switch to a self-hosted Qdrant:
 *   1. Set QDRANT_URL in .env.local
 *   2. Import the vector snapshots per the restore guide
 *   3. Update searchJudgments/searchLegislation to query Qdrant
 * ────────────────────────────────────────────────────────────────── */

export type JudgmentResult = {
  caseId: string;
  title: string;
  court: string;
  bench?: string;
  judges?: string;
  decisionDate?: string;
  year?: number;
  citation?: string;
  summary?: string;
  sourceUrl?: string;
};

export type LegislationResult = {
  actId: string;
  title: string;
  sectionNumber?: string;
  sectionTitle?: string;
  text?: string;
  state?: string;
  year?: number;
  status?: "in_force" | "repealed" | "spent";
  sourceUrl?: string;
};

export type SearchFilters = {
  scope: "Judgements" | "Bare Acts" | "Tribunals";
  court?: string;
  term: string;
  fromDate?: string;
  toDate?: string;
  actTitle?: string;
  section?: string;
  party1?: string;
  party2?: string;
  judge?: string;
};

export type SearchResult = {
  title: string;
  meta: string;
  note: string;
  sourceUrl?: string;
};

/* ── All courts from the OpenIndiaLaw dataset ────────────────────── */
export const COURTS = [
  "All Courts",
  "Supreme Court of India",
  "Allahabad High Court",
  "Andhra Pradesh High Court",
  "Bombay High Court",
  "Calcutta High Court",
  "Chhattisgarh High Court",
  "Delhi High Court",
  "Gauhati High Court",
  "Gujarat High Court",
  "Himachal Pradesh High Court",
  "Jammu and Kashmir High Court",
  "Jharkhand High Court",
  "Karnataka High Court",
  "Kerala High Court",
  "Madhya Pradesh High Court",
  "Madras High Court",
  "Manipur High Court",
  "Meghalaya High Court",
  "Orissa High Court",
  "Patna High Court",
  "Punjab and Haryana High Court",
  "Rajasthan High Court",
  "Sikkim High Court",
  "Telangana High Court",
  "Tripura High Court",
  "Uttarakhand High Court",
] as const;

/* ── Tribunal forums ─────────────────────────────────────────────── */
export const TRIBUNALS = [
  "All Tribunals",
  "ITAT (Income Tax Appellate Tribunal)",
  "NCLT (National Company Law Tribunal)",
  "NGT (National Green Tribunal)",
  "CAT (Central Administrative Tribunal)",
  "CESTAT (Customs, Excise and Service Tax)",
  "DRT (Debts Recovery Tribunal)",
  "SAT (Securities Appellate Tribunal)",
  "CCI (Competition Commission of India)",
  "APTEL (Appellate Tribunal for Electricity)",
  "TDSAT (Telecom Disputes Settlement)",
] as const;

/**
 * Search the OpenIndiaLaw dataset.
 *
 * Currently returns placeholder results.
 * To connect to a live backend:
 *   - Point this at /api/research which proxies to Vaquill mirror or Qdrant
 *   - The API route handles authentication and rate limiting
 */
export async function searchOpenIndiaLaw(filters: SearchFilters): Promise<SearchResult[]> {
  // TODO: Replace with actual API call:
  // const res = await fetch("/api/research", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(filters),
  // });
  // return res.json();

  // Placeholder results for development
  if (filters.scope === "Bare Acts") {
    return [
      {
        title: "Constitution of India, Article 14",
        meta: "Central · In Force · 1950",
        note: "Equality before law — The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.",
        sourceUrl: "https://www.indiacode.nic.in/",
      },
      {
        title: "Code of Civil Procedure, 1908 — Section 9",
        meta: "Central · In Force · 1908",
        note: "Courts to try all civil suits unless barred — The Courts shall have jurisdiction to try all suits of a civil nature excepting suits of which their cognizance is either expressly or impliedly barred.",
        sourceUrl: "https://www.indiacode.nic.in/",
      },
    ];
  }

  return [
    {
      title: "Maneka Gandhi v. Union of India",
      meta: "Supreme Court of India · (1978) 1 SCC 248",
      note: "Fair procedure and natural justice form part of non-arbitrariness under Article 14.",
    },
    {
      title: "Canara Bank v. Debasis Das",
      meta: "Supreme Court of India · (2003) 4 SCC 557",
      note: "Explains the core rules of natural justice and the requirement of a fair hearing.",
    },
    {
      title: "Dharampal Satyapal Ltd. v. Dy. Commissioner",
      meta: "Supreme Court of India · (2015) 8 SCC 519",
      note: "Considers prejudice and the consequences of breach of natural justice.",
    },
  ];
}
