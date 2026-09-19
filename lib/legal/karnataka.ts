import type { CalculationInput, SuitType } from "./types";

export const KARNATAKA_SOURCES = [
  {
    title: "Karnataka Court Fees and Suits Valuation Act, 1958",
    url: "https://dpal.karnataka.gov.in/storage/pdf-files/acts%20alpha%20and%20dept%20wise%20acts/16%20of%201958%20%28E%29.pdf",
    note: "Official DPAL compilation; valuation sections 6–50 and Schedule I.",
  },
  {
    title: "Karnataka Civil Courts Act, 1964 (as amended by Act 33 of 2024)",
    url: "https://dpal.karnataka.gov.in/storage/pdf-files/21of1964%28E%2933of2024.pdf",
    note: "Official DPAL compilation; section 17 now gives Civil Judges original jurisdiction up to ₹15 lakh.",
  },
  {
    title: "Code of Civil Procedure, 1908",
    url: "https://www.indiacode.nic.in/bitstream/123456789/13813/1/the_code_of_civil_procedure%2C_1908.pdf",
    note: "Official India Code text; sections 15, 16 and 20 are used for forum and territorial baselines.",
  },
];

type KarnatakaValuation = {
  suitValue: number;
  feeBasis: number | null;
  courtFee: number;
  formula: string;
  section: string;
  trace: string[];
  jurisdictionValue?: number;
};

const required = (value: number | undefined, label: string) => {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} is required and must be zero or more.`);
  }
  return Math.round(value * 100) / 100;
};

const money = (value: number) => `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)}`;

/** Schedule I, Article 1: ad-valorem fee table inserted by Karnataka Act 2 of 1993. */
export function karnatakaAdValorem(value: number) {
  const v = Math.max(0, value);
  if (v <= 15_000) return v * 0.025;
  if (v <= 75_000) return 375 + (v - 15_000) * 0.075;
  if (v <= 250_000) return 4_875 + (v - 75_000) * 0.07;
  if (v <= 500_000) return 17_125 + (v - 250_000) * 0.065;
  if (v <= 750_000) return 33_375 + (v - 500_000) * 0.06;
  if (v <= 1_000_000) return 48_375 + (v - 750_000) * 0.055;
  if (v <= 1_500_000) return 62_125 + (v - 1_000_000) * 0.05;
  if (v <= 2_000_000) return 87_125 + (v - 1_500_000) * 0.045;
  if (v <= 2_500_000) return 109_625 + (v - 2_000_000) * 0.04;
  if (v <= 3_000_000) return 129_625 + (v - 2_500_000) * 0.035;
  if (v <= 4_000_000) return 147_125 + (v - 3_000_000) * 0.03;
  if (v <= 5_000_000) return 177_125 + (v - 4_000_000) * 0.025;
  if (v <= 6_000_000) return 202_125 + (v - 5_000_000) * 0.02;
  if (v <= 7_000_000) return 222_125 + (v - 6_000_000) * 0.015;
  if (v <= 8_000_000) return 237_125 + (v - 7_000_000) * 0.01;
  return 247_125 + (v - 8_000_000) * 0.005;
}

function adValoremResult(suitValue: number, feeBasis: number, section: string, formula: string, trace: string[], jurisdictionValue?: number): KarnatakaValuation {
  return {
    suitValue,
    feeBasis,
    courtFee: Math.round(karnatakaAdValorem(feeBasis) * 100) / 100,
    section,
    formula,
    trace: [...trace, `Schedule I, Article 1 applied to ${money(feeBasis)}`],
    jurisdictionValue,
  };
}

function fixedResult(suitValue: number, courtFee: number, section: string, formula: string, trace: string[]): KarnatakaValuation {
  return { suitValue, feeBasis: null, courtFee, section, formula, trace };
}

function statutoryPropertyValue(input: CalculationInput) {
  const method = input.propertyValuationMethod ?? "market";
  const actualMarket = required(input.propertyMarketValue, "Property market value");
  if (method === "permanent_revenue") {
    const revenue = required(input.annualLandRevenue, "Annual land revenue");
    return { feeValue: revenue * 25, jurisdictionValue: actualMarket, text: `25 × annual land revenue of ${money(revenue)}`, section: "section 7(2)(a)" };
  }
  if (method === "temporary_revenue") {
    const revenue = required(input.annualLandRevenue, "Annual land revenue");
    return { feeValue: revenue * 12.5, jurisdictionValue: actualMarket, text: `12.5 × annual land revenue of ${money(revenue)}`, section: "section 7(2)(b)" };
  }
  if (method === "profits_or_comparable") {
    const profits = required(input.priorYearNetProfits, "Previous-year net profits");
    const comparable = required(input.comparableLandRevenue, "Comparable neighbouring land revenue");
    const feeValue = Math.min(profits * 15, comparable * 30);
    return { feeValue, jurisdictionValue: actualMarket, text: `lower of 15 × net profits and 30 × comparable land revenue`, section: "section 7(2)(c)" };
  }
  return { feeValue: actualMarket, jurisdictionValue: actualMarket, text: "actual market value", section: "section 7(2)(d)" };
}

function unprovidedFixed(value: number) {
  if (value <= 5_000) return 20;
  if (value < 10_000) return 100;
  return 200;
}

export function calculateKarnataka(input: CalculationInput): KarnatakaValuation {
  switch (input.suitType) {
    case "money_recovery":
    case "damages": {
      const value = required(input.claimAmount, input.suitType === "damages" ? "Damages claimed" : "Claim amount");
      return adValoremResult(value, value, "section 21", "Amount claimed in the plaint", [`Section 21 values the suit at ${money(value)}`]);
    }
    case "maintenance": {
      const annual = required(input.claimAmount, "Annual maintenance or periodic payment");
      const years = input.durationYears;
      const value = years !== undefined && years < 5 ? annual * years : annual * 5;
      return adValoremResult(value, value, "section 22", years !== undefined && years < 5 ? "Annual amount × stated term under five years" : "Five times the annual amount", [`Section 22 produces ${money(value)}`]);
    }
    case "movable_property": {
      const value = required(input.claimAmount, "Movable property's market value");
      return adValoremResult(value, value, "section 23", "Market value of movable property", [`Section 23 uses ${money(value)}`]);
    }
    case "declaration_only": {
      const stated = required(input.reliefValue, "Value placed on declaratory relief");
      const value = Math.max(stated, 1_000);
      return adValoremResult(value, value, "section 24(d)", "Plaintiff-stated value, subject to a ₹1,000 statutory minimum", [`Higher of ${money(stated)} and ₹1,000`]);
    }
    case "declaration_consequential": {
      const property = statutoryPropertyValue(input);
      const value = Math.max(property.feeValue / 2, 1_000);
      return adValoremResult(value, value, "section 24(b)", "Half the statutory property value, subject to a ₹1,000 minimum", [`Property value under ${property.section}: ${property.text}`, `Higher of half that value and ₹1,000`], property.jurisdictionValue);
    }
    case "injunction": {
      if (input.immovableProperty && input.titleDenied) {
        const property = statutoryPropertyValue(input);
        const value = Math.max(property.feeValue / 2, 1_000);
        return adValoremResult(value, value, "section 26(a)", "Half the statutory property value where title is denied or in issue, subject to ₹1,000 minimum", [`Property value under ${property.section}: ${property.text}`], property.jurisdictionValue);
      }
      const stated = required(input.reliefValue, "Value placed on injunction");
      const value = Math.max(stated, 1_000);
      return adValoremResult(value, value, "section 26(c)", "Plaintiff-stated value, subject to a ₹1,000 minimum", [`Higher of ${money(stated)} and ₹1,000`]);
    }
    case "possession": {
      const property = statutoryPropertyValue(input);
      const value = Math.max(property.feeValue, 1_000);
      return adValoremResult(value, value, "section 29 read with section 7", "Statutory market value, subject to a ₹1,000 minimum", [`Property value under ${property.section}: ${property.text}`], property.jurisdictionValue);
    }
    case "partition": {
      const property = statutoryPropertyValue(input);
      const share = required(input.plaintiffSharePercent, "Plaintiff share percentage");
      if (share > 100) throw new Error("Plaintiff share cannot exceed 100%.");
      const shareValue = property.feeValue * share / 100;
      const jurisdictionShare = property.jurisdictionValue * share / 100;
      if (input.excludedFromPossession) {
        return adValoremResult(shareValue, shareValue, "section 35(1)", "Statutory market value of the plaintiff's share because exclusion from possession is stated", [`${money(property.feeValue)} × ${share}% = ${money(shareValue)}`], jurisdictionShare);
      }
      const fixed = shareValue <= 3_000 ? 15 : shareValue <= 5_000 ? 30 : shareValue < 10_000 ? 100 : 200;
      return fixedResult(jurisdictionShare, fixed, "section 35(2)", "Fixed fee where joint possession is admitted", [`Plaintiff's share value: ${money(shareValue)}`, `Section 35(2) fixed fee: ${money(fixed)}`]);
    }
    case "landlord_tenant": {
      const annual = required(input.annualRent, "Prior-year rent");
      const premium = input.premiumAmount ?? 0;
      const value = annual + premium;
      return adValoremResult(value, value, "section 41", premium ? "Lease premium plus prior-year rent" : "Prior-year rent", [`${money(premium)} premium + ${money(annual)} rent`]);
    }
    case "accounts": {
      const value = required(input.reliefValue, "Estimated amount due");
      return adValoremResult(value, value, "section 33", "Amount estimated in the plaint, subject to later adjustment", [`Plaintiff's estimate: ${money(value)}`]);
    }
    case "mortgage": {
      const amount = required(input.securedAmount, "Mortgage amount");
      const variant = input.reliefVariant ?? "recovery";
      if (variant === "redemption") {
        const due = input.secondaryAmount ?? amount;
        const value = Math.max(due, amount / 4);
        return adValoremResult(value, value, "section 32(b)", "Higher of amount due and one-fourth of principal secured", [`Higher of ${money(due)} and ${money(amount / 4)}`]);
      }
      return adValoremResult(amount, amount, variant === "foreclosure" ? "section 32(c)" : "section 32(a)", variant === "foreclosure" ? "Principal plus interest claimed" : "Mortgage money claimed", [`Mortgage relief valued at ${money(amount)}`]);
    }
    case "administration": {
      const estate = required(input.estateValue, "Estate value");
      const fee = unprovidedFixed(estate);
      return fixedResult(estate, fee, "sections 37 and 47", "Initial fixed fee under section 47; further fee can arise when money or a share is ordered", [`Estate stated at ${money(estate)}`, `Initial section 47 fee: ${money(fee)}`]);
    }
    case "specific_performance": {
      const variant = input.reliefVariant ?? "sale";
      const principal = required(input.considerationAmount, "Contract amount");
      if (variant === "lease") {
        const rent = input.secondaryAmount ?? 0;
        const value = principal + rent;
        return adValoremResult(value, value, "section 40(c)", "Fine or premium plus average annual rent", [`${money(principal)} premium + ${money(rent)} annual rent`]);
      }
      return adValoremResult(principal, principal, `section 40(${variant === "mortgage" ? "b" : variant === "exchange" ? "d" : "a"})`, variant === "sale" ? "Sale consideration" : variant === "mortgage" ? "Amount agreed to be secured" : "Consideration or market value of property sought", [`Specific-performance value: ${money(principal)}`]);
    }
    case "easement": {
      const value = Math.max(required(input.reliefValue, "Value placed on easement relief"), 1_000);
      return adValoremResult(value, value, "section 30", "Plaintiff-stated value, subject to a ₹1,000 minimum", [`Easement relief valued at ${money(value)}`]);
    }
    case "preemption": {
      const sale = required(input.claimAmount, "Sale consideration");
      const market = required(input.secondaryAmount, "Property market value");
      const value = Math.min(sale, market);
      return adValoremResult(value, value, "section 31", "Lower of sale consideration and market value", [`Lower of ${money(sale)} and ${money(market)}`]);
    }
    case "cancellation": {
      const value = required(input.claimAmount, "Decree, document or property value");
      return adValoremResult(value, value, "section 38", "Amount or property value represented by the decree or document cancelled", [`Cancellation value: ${money(value)}`]);
    }
    case "mesne_profits": {
      const value = required(input.claimAmount, "Mesne profits claimed");
      return adValoremResult(value, value, "section 42", "Approximate amount sued for", [`Approximate mesne profits: ${money(value)}`]);
    }
    case "set_aside_attachment": {
      const market = required(input.claimAmount, "Attached property's market value");
      const attached = required(input.secondaryAmount, "Amount for which attachment was made");
      const value = Math.min(market / 4, attached);
      return adValoremResult(value, value, "section 39", "Lower of one-fourth property value and the amount of attachment", [`Lower of ${money(market / 4)} and ${money(attached)}`]);
    }
    case "revenue_register":
      return fixedResult(1_000, 50, "section 43", "Statutory fixed fee", ["Section 43 fixed fee: ₹50"]);
    case "public_matter":
      return fixedResult(1_000, 50, "section 44", "Statutory fixed fee", ["Section 44 fixed fee: ₹50"]);
    case "appeal": {
      const value = required(input.lowerCourtSuitValue, "Subject matter in appeal");
      const firstInstanceFee = required(input.secondaryAmount, "First-instance fee for the appealed subject matter");
      return fixedResult(value, firstInstanceFee, "section 49", "Same fee as the court of first instance on the subject matter in appeal", [`Appeal subject matter: ${money(value)}`, `Carried first-instance fee: ${money(firstInstanceFee)}`]);
    }
    case "other": {
      const value = required(input.reliefValue, "Value placed on relief");
      const fee = unprovidedFixed(value);
      return fixedResult(value, fee, "section 47", "Fixed fee for suits not otherwise provided for", [`Section 47 fixed fee: ${money(fee)}`]);
    }
  }
}

export const KARNATAKA_SUPPORTED_TYPES: SuitType[] = [
  "money_recovery", "damages", "maintenance", "movable_property", "declaration_only",
  "declaration_consequential", "injunction", "possession", "partition", "landlord_tenant",
  "accounts", "mortgage", "administration", "specific_performance", "easement", "preemption",
  "cancellation", "mesne_profits", "set_aside_attachment", "revenue_register", "public_matter",
  "appeal", "other",
];
