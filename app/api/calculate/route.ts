import { z } from "zod";
import { calculateSuit } from "@/lib/legal/engine";

const schema = z.object({
  stateId: z.string().min(1),
  district: z.string().default(""),
  suitType: z.enum([
    "money_recovery", "damages", "specific_performance", "declaration_only",
    "declaration_consequential", "injunction", "possession", "partition",
    "landlord_tenant", "accounts", "mortgage", "administration", "appeal",
    "maintenance", "movable_property", "easement", "preemption", "cancellation",
    "mesne_profits", "set_aside_attachment", "revenue_register", "public_matter", "other",
  ]),
  claimAmount: z.number().nonnegative().optional(),
  propertyMarketValue: z.number().nonnegative().optional(),
  considerationAmount: z.number().nonnegative().optional(),
  annualRent: z.number().nonnegative().optional(),
  estateValue: z.number().nonnegative().optional(),
  securedAmount: z.number().nonnegative().optional(),
  lowerCourtSuitValue: z.number().nonnegative().optional(),
  plaintiffSharePercent: z.number().min(0).max(100).optional(),
  reliefValue: z.number().nonnegative().optional(),
  secondaryAmount: z.number().nonnegative().optional(),
  durationYears: z.number().nonnegative().optional(),
  premiumAmount: z.number().nonnegative().optional(),
  titleDenied: z.boolean().optional(),
  reliefVariant: z.string().optional(),
  propertyValuationMethod: z.enum(["market", "permanent_revenue", "temporary_revenue", "profits_or_comparable"]).optional(),
  annualLandRevenue: z.number().nonnegative().optional(),
  priorYearNetProfits: z.number().nonnegative().optional(),
  comparableLandRevenue: z.number().nonnegative().optional(),
  excludedFromPossession: z.boolean().optional(),
  commercialDispute: z.boolean().optional(),
  immovableProperty: z.boolean().optional(),
  defendantLocation: z.string().optional(),
  causeOfActionLocation: z.string().optional(),
  propertyLocation: z.string().optional(),
  localLowerCourtLimit: z.number().nonnegative().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    return Response.json({ ok: true, result: calculateSuit(body) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to calculate the suit valuation.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
