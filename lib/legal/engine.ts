import { JURISDICTION_BY_ID, SUIT_TYPES } from "./catalogue";
import { calculateKarnataka, KARNATAKA_SOURCES } from "./karnataka";
import { getStateBackend } from "./state-registry";
import type { CalculationInput, CalculationResult } from "./types";

const amount = (value: number | undefined, label: string) => {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} is required and must be zero or more.`);
  }
  return Math.round(value * 100) / 100;
};

function valuation(input: CalculationInput) {
  switch (input.suitType) {
    case "money_recovery":
      return { value: amount(input.claimAmount, "Claim amount"), feeBasis: amount(input.claimAmount, "Claim amount"), formula: "Amount claimed in the plaint" };
    case "damages":
      return { value: amount(input.claimAmount, "Damages claimed"), feeBasis: amount(input.claimAmount, "Damages claimed"), formula: "Compensation or damages claimed" };
    case "specific_performance":
      return { value: amount(input.considerationAmount, "Contract consideration"), feeBasis: amount(input.considerationAmount, "Contract consideration"), formula: "Consideration stated in the agreement" };
    case "declaration_only":
      return { value: amount(input.reliefValue, "Value placed on declaratory relief"), feeBasis: null, formula: "Plaintiff-stated notional value, subject to the applicable State Act and court scrutiny" };
    case "declaration_consequential":
    case "injunction":
    case "accounts":
      return { value: amount(input.reliefValue ?? input.propertyMarketValue, "Value placed on the relief"), feeBasis: amount(input.reliefValue ?? input.propertyMarketValue, "Value placed on the relief"), formula: "Value placed on the relief, subject to statutory minimums and court scrutiny" };
    case "possession":
      return { value: amount(input.propertyMarketValue, "Property market value"), feeBasis: amount(input.propertyMarketValue, "Property market value"), formula: "Market value of the immovable property or statutory substitute where applicable" };
    case "partition": {
      const market = amount(input.propertyMarketValue, "Property market value");
      const share = amount(input.plaintiffSharePercent, "Plaintiff share percentage");
      if (share > 100) throw new Error("Plaintiff share cannot exceed 100%.");
      const shareValue = Math.round((market * share) / 100);
      return {
        value: shareValue,
        feeBasis: input.excludedFromPossession ? shareValue : null,
        formula: input.excludedFromPossession
          ? `Market value × plaintiff share (${share}%) because exclusion from possession is stated`
          : `Plaintiff share value (${share}%) for jurisdiction; a fixed fee may apply when joint possession is admitted`,
      };
    }
    case "landlord_tenant": {
      const rent = amount(input.annualRent, "Annual rent");
      return { value: rent, feeBasis: rent, formula: "One year's rent (baseline); local law may add arrears, premium or another statutory component" };
    }
    case "mortgage":
      return { value: amount(input.securedAmount, "Secured amount"), feeBasis: amount(input.securedAmount, "Secured amount"), formula: "Amount secured by or due under the mortgage" };
    case "administration":
      return { value: amount(input.estateValue, "Estate value"), feeBasis: amount(input.estateValue, "Estate value"), formula: "Value of the estate brought under administration" };
    case "appeal":
      return { value: amount(input.lowerCourtSuitValue, "Lower-court suit value"), feeBasis: amount(input.lowerCourtSuitValue, "Lower-court suit value"), formula: "Valuation carried forward from the proceeding under appeal" };
    case "maintenance": {
      const annual = amount(input.claimAmount, "Annual amount");
      const years = input.durationYears;
      const value = years !== undefined && years < 5 ? annual * years : annual * 5;
      return { value, feeBasis: value, formula: years !== undefined && years < 5 ? "Annual amount × stated duration" : "Five times the annual amount" };
    }
    case "movable_property":
    case "cancellation":
    case "mesne_profits":
      return { value: amount(input.claimAmount, "Amount or value"), feeBasis: amount(input.claimAmount, "Amount or value"), formula: "Amount or market value stated" };
    case "easement":
    case "other":
      return { value: amount(input.reliefValue, "Value placed on relief"), feeBasis: amount(input.reliefValue, "Value placed on relief"), formula: "Value placed on the relief" };
    case "preemption": {
      const sale = amount(input.claimAmount, "Sale consideration");
      const market = amount(input.secondaryAmount, "Market value");
      return { value: Math.min(sale, market), feeBasis: Math.min(sale, market), formula: "Lower of sale consideration and market value" };
    }
    case "set_aside_attachment": {
      const market = amount(input.claimAmount, "Property value");
      const attached = amount(input.secondaryAmount, "Attachment amount");
      return { value: Math.min(market / 4, attached), feeBasis: Math.min(market / 4, attached), formula: "Lower of one-fourth property value and attachment amount" };
    }
    case "revenue_register":
    case "public_matter":
      return { value: 1000, feeBasis: null, formula: "Fixed-fee relief under the applicable State Act" };
  }
}

function chooseCourt(input: CalculationInput, suitValue: number) {
  const state = JURISDICTION_BY_ID[input.stateId];
  if (input.commercialDispute && suitValue >= 300000) {
    return "Commercial Court / Commercial Division having territorial and pecuniary competence";
  }
  if (input.localLowerCourtLimit && input.localLowerCourtLimit > 0) {
    return suitValue <= input.localLowerCourtLimit
      ? "Civil Judge (Junior Division) / lowest competent civil court"
      : "Civil Judge (Senior Division) or District Court, subject to the State court structure";
  }
  const band = state.pecuniaryBands?.find((item) => item.max === null || suitValue <= item.max);
  return band?.court ?? "Lowest competent civil court in the selected district — current pecuniary notification must be checked";
}

function territorialBasis(input: CalculationInput) {
  if (input.immovableProperty) {
    return input.propertyLocation
      ? `Court for ${input.propertyLocation}, where the immovable property is stated to be situated (CPC section 16 baseline).`
      : "Court where the immovable property is situated (CPC section 16 baseline).";
  }
  const places = [input.defendantLocation, input.causeOfActionLocation].filter(Boolean);
  return places.length
    ? `${places.join(" or ")} — based on defendant residence/business and/or where the cause of action arose (CPC section 20 baseline).`
    : "Court where the defendant resides or carries on business, or where the cause of action wholly or partly arose (CPC section 20 baseline).";
}

export function calculateSuit(input: CalculationInput): CalculationResult {
  const state = JURISDICTION_BY_ID[input.stateId];
  if (!state) throw new Error("Choose a valid State or Union Territory.");
  const backend = getStateBackend(input.stateId);
  if (backend.status === "connected" && backend.key === "karnataka") {
    const calculated = calculateKarnataka(input);
    const label = SUIT_TYPES.find((item) => item.id === input.suitType)?.label ?? input.suitType;
    const forumInput = { ...input };
    const warnings = [
      "This is a statutory calculation aid, not a filing opinion. Verify amendments, special forums, local filing practice and facts with counsel or the registry before payment.",
    ];
    if (!input.district.trim()) warnings.unshift("District is missing; territorial filing location cannot be identified.");
    if (/bengaluru|bangalore/i.test(input.district)) warnings.unshift("Bengaluru City Civil Court and Small Causes allocations can modify the ordinary district-court label; confirm the correct filing establishment.");
    return {
      state,
      suitType: input.suitType,
      suitTypeLabel: label,
      suitValuation: calculated.jurisdictionValue ?? calculated.suitValue,
      courtFeeBasis: calculated.feeBasis,
      courtFee: calculated.courtFee,
      courtFeeStatus: "calculated",
      court: chooseCourt(forumInput, calculated.jurisdictionValue ?? calculated.suitValue),
      territorialBasis: territorialBasis(input),
      commercialTrack: input.commercialDispute
        ? (calculated.jurisdictionValue ?? calculated.suitValue) >= 300000
          ? "Commercial track is indicated by the ₹3,00,000 central baseline, subject to the dispute satisfying the statutory commercial-dispute definition and local notification."
          : "The stated value is below the ₹3,00,000 central commercial-court baseline."
        : null,
      formula: calculated.formula,
      ruleTrace: [
        `Karnataka Court Fees and Suits Valuation Act, 1958 — ${calculated.section}`,
        `Relief classified as: ${label}`,
        ...calculated.trace,
        input.immovableProperty ? "Territorial baseline: CPC section 16" : "Territorial baseline: CPC section 20",
        "Forum baseline: CPC section 15 and Karnataka Civil Courts Act, 1964, section 17 (₹15 lakh Civil Judge limit)",
      ],
      warnings,
      legalSources: KARNATAKA_SOURCES,
    };
  }

  const calculated = valuation(input);
  const label = SUIT_TYPES.find((item) => item.id === input.suitType)?.label ?? input.suitType;
  const warnings = [
    "Court-fee amount is deliberately not produced until the applicable State schedule, amendments and notifications are source-verified.",
    "The result is an intake aid, not a filing opinion. A lawyer or filing registry should confirm the final valuation, fee and forum.",
  ];
  if (!input.district.trim()) warnings.unshift("District is missing; the tool can identify the rule but not a filing location.");
  if (state.verification !== "verified") warnings.unshift(state.notes);

  return {
    state,
    suitType: input.suitType,
    suitTypeLabel: label,
    suitValuation: calculated.value,
    courtFeeBasis: calculated.feeBasis,
    courtFee: null,
    courtFeeStatus: "not-calculated",
    court: chooseCourt(input, calculated.value),
    territorialBasis: territorialBasis(input),
    commercialTrack: input.commercialDispute
      ? calculated.value >= 300000
        ? "Commercial track indicated because the stated specified value is at least ₹3,00,000. Statutory subject matter and local notification must still be checked."
        : "Stated value is below ₹3,00,000; ordinary commercial-court routing is not indicated by the baseline threshold."
      : null,
    formula: calculated.formula,
    ruleTrace: [
      `${state.name}: ${state.act}`,
      `Relief classified as: ${label}`,
      `Valuation rule: ${calculated.formula}`,
      input.immovableProperty ? "Territorial baseline: CPC section 16" : "Territorial baseline: CPC section 20",
      "Institution baseline: file in the lowest-grade competent court under CPC section 15",
    ],
    warnings,
    legalSources: state.sourceUrl ? [{ title: state.act, url: state.sourceUrl, note: state.notes }] : [],
  };
}
