export type SuitType =
  | "money_recovery"
  | "damages"
  | "specific_performance"
  | "declaration_only"
  | "declaration_consequential"
  | "injunction"
  | "possession"
  | "partition"
  | "landlord_tenant"
  | "accounts"
  | "mortgage"
  | "administration"
  | "appeal"
  | "maintenance"
  | "movable_property"
  | "easement"
  | "preemption"
  | "cancellation"
  | "mesne_profits"
  | "set_aside_attachment"
  | "revenue_register"
  | "public_matter"
  | "other";

export type VerificationLevel = "framework" | "provisional" | "verified";

export interface JurisdictionRule {
  id: string;
  name: string;
  kind: "State" | "Union Territory";
  act: string;
  actFamily: string;
  verification: VerificationLevel;
  verifiedThrough: string;
  notes: string;
  sourceUrl?: string;
  pecuniaryBands?: Array<{ max: number | null; court: string }>;
}

export interface CalculationInput {
  stateId: string;
  district: string;
  suitType: SuitType;
  claimAmount?: number;
  propertyMarketValue?: number;
  considerationAmount?: number;
  annualRent?: number;
  estateValue?: number;
  securedAmount?: number;
  lowerCourtSuitValue?: number;
  plaintiffSharePercent?: number;
  reliefValue?: number;
  secondaryAmount?: number;
  durationYears?: number;
  premiumAmount?: number;
  titleDenied?: boolean;
  reliefVariant?: string;
  propertyValuationMethod?: "market" | "permanent_revenue" | "temporary_revenue" | "profits_or_comparable";
  annualLandRevenue?: number;
  priorYearNetProfits?: number;
  comparableLandRevenue?: number;
  excludedFromPossession?: boolean;
  commercialDispute?: boolean;
  immovableProperty?: boolean;
  defendantLocation?: string;
  causeOfActionLocation?: string;
  propertyLocation?: string;
  localLowerCourtLimit?: number;
}

export interface CalculationResult {
  state: JurisdictionRule;
  suitType: SuitType;
  suitTypeLabel: string;
  suitValuation: number;
  courtFeeBasis: number | null;
  courtFee: number | null;
  courtFeeStatus: "not-calculated" | "calculated";
  court: string;
  territorialBasis: string;
  commercialTrack: string | null;
  formula: string;
  ruleTrace: string[];
  warnings: string[];
  legalSources: Array<{ title: string; url: string; note: string }>;
}
