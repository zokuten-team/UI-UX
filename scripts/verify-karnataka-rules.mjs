import assert from "node:assert/strict";
import { calculateKarnataka, karnatakaAdValorem } from "../lib/legal/karnataka.ts";

const checkpoints = [
  [15_000, 375], [75_000, 4_875], [250_000, 17_125], [500_000, 33_375],
  [1_000_000, 62_125], [1_500_000, 87_125], [8_000_000, 247_125],
];

for (const [value, expected] of checkpoints) {
  assert.equal(karnatakaAdValorem(value), expected, `Schedule I boundary ${value}`);
}

assert.equal(
  calculateKarnataka({ stateId: "ka", district: "Mysuru", suitType: "partition", propertyMarketValue: 4_000_000, plaintiffSharePercent: 25, excludedFromPossession: false }).courtFee,
  200,
  "Joint-possession partition fixed fee",
);

const agricultural = calculateKarnataka({
  stateId: "ka", district: "Mysuru", suitType: "possession", propertyMarketValue: 5_000_000,
  propertyValuationMethod: "temporary_revenue", annualLandRevenue: 10_000,
});
assert.equal(agricultural.feeBasis, 125_000);
assert.equal(agricultural.jurisdictionValue, 5_000_000);
assert.equal(agricultural.courtFee, 8_375);

assert.equal(
  calculateKarnataka({ stateId: "ka", district: "Mysuru", suitType: "money_recovery", claimAmount: 500_000 }).courtFee,
  33_375,
  "Money suit ad-valorem fee",
);

console.log(`Verified ${checkpoints.length + 3} Karnataka statutory rule checkpoints.`);
