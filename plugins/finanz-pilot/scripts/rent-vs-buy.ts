#!/usr/bin/env bun
/**
 * rent-vs-buy — deterministic buy-to-live comparison over multiple horizons.
 * Implements the model in references/rent-vs-buy-model.md. Pure math; LLM interprets.
 *
 * Input: JSON on stdin or --input '<json>':
 * {
 *   "purchase_price": 500000,
 *   "kaufnebenkosten_pct": 12,         // Grunderwerbsteuer + notary + agent
 *   "equity": 150000,                  // Eigenkapital applied to price+nebenkosten
 *   "mortgage_rate_pct": 3.6,          // Sollzins
 *   "tilgung_pct": 2.0,                // initial annual repayment rate
 *   "hausgeld_monthly": 350,
 *   "current_rent_monthly": 1600,
 *   "rent_increase_pct": 2.5,
 *   "etf_return_pct": 6.5,             // opportunity cost of equity (nominal)
 *   "etf_tax_pct": 18.46,             // effective on gains (Abgeltungsteuer w/ Teilfreistellung)
 *   "appreciation_pct": 2.0,
 *   "horizons": [10, 20, 30]
 * }
 *
 * Output: per-horizon total owning cost vs total renting cost (incl. opportunity cost of
 * equity and remaining-mortgage/appreciation at horizon), and the break-even year.
 */
import { readFileSync } from "fs";

function readInput(): any {
  const i = process.argv.indexOf("--input");
  const raw = i >= 0 ? process.argv[i + 1] : readFileSync(0, "utf-8");
  return JSON.parse(raw);
}
function round(n: number): number { return Math.round(n); }

const x = readInput();
const nebenkosten = x.purchase_price * (x.kaufnebenkosten_pct ?? 12) / 100;
const totalAcquisition = x.purchase_price + nebenkosten;
const loan0 = Math.max(0, totalAcquisition - (x.equity ?? 0));
const rMonthly = (x.mortgage_rate_pct ?? 3.5) / 100 / 12;
// Annuität from initial Zins + Tilgung rate on the starting loan.
const annualAnnuity = loan0 * ((x.mortgage_rate_pct ?? 3.5) + (x.tilgung_pct ?? 2)) / 100;
const monthlyAnnuity = annualAnnuity / 12;

function ownershipAtYear(years: number) {
  // Amortize the loan month by month at fixed annuity.
  let bal = loan0;
  let interestPaid = 0, principalPaid = 0;
  for (let m = 0; m < years * 12 && bal > 0; m++) {
    const interest = bal * rMonthly;
    let principal = monthlyAnnuity - interest;
    if (principal > bal) principal = bal;
    interestPaid += interest;
    principalPaid += principal;
    bal -= principal;
  }
  const hausgeld = (x.hausgeld_monthly ?? 0) * 12 * years;
  const propertyValue = x.purchase_price * Math.pow(1 + (x.appreciation_pct ?? 2) / 100, years);
  // Net cost of owning = cash out (nebenkosten + interest + hausgeld) - equity built (principal)
  //                      - net appreciation gain. Equity itself is retained in the asset.
  const cashCosts = nebenkosten + interestPaid + hausgeld;
  const appreciationGain = propertyValue - x.purchase_price;
  const netOwningCost = cashCosts - appreciationGain;
  return { interestPaid, principalPaid, remaining_loan: bal, hausgeld, propertyValue, netOwningCost };
}

function rentingAtYear(years: number) {
  // Total rent paid with annual increases.
  let rent = (x.current_rent_monthly ?? 0) * 12;
  let totalRent = 0;
  for (let y = 0; y < years; y++) { totalRent += rent; rent *= 1 + (x.rent_increase_pct ?? 2.5) / 100; }
  // Opportunity: invest the equity (would-be down payment) in ETF over the horizon.
  const equityGrown = (x.equity ?? 0) * Math.pow(1 + (x.etf_return_pct ?? 6) / 100, years);
  const gain = equityGrown - (x.equity ?? 0);
  const netGain = gain * (1 - (x.etf_tax_pct ?? 18.46) / 100);
  // Net cost of renting = rent paid - investment gain on the retained equity.
  const netRentingCost = totalRent - netGain;
  return { totalRent, equityGrown, investment_net_gain: netGain, netRentingCost };
}

const horizons = x.horizons ?? [10, 20, 30];
const results = horizons.map((y: number) => {
  const own = ownershipAtYear(y);
  const rent = rentingAtYear(y);
  return {
    years: y,
    owning_net_cost: round(own.netOwningCost),
    renting_net_cost: round(rent.netRentingCost),
    buying_cheaper_by: round(rent.netRentingCost - own.netOwningCost),
    detail: {
      interest_paid: round(own.interestPaid),
      principal_paid: round(own.principalPaid),
      remaining_loan: round(own.remaining_loan),
      property_value: round(own.propertyValue),
      total_rent_paid: round(rent.totalRent),
      equity_if_invested: round(rent.equityGrown),
    },
  };
});

// Break-even: first whole year where owning_net_cost <= renting_net_cost.
let breakEven: number | null = null;
for (let y = 1; y <= Math.max(...horizons); y++) {
  if (ownershipAtYear(y).netOwningCost <= rentingAtYear(y).netRentingCost) { breakEven = y; break; }
}

console.log(JSON.stringify({
  assumptions: {
    total_acquisition: round(totalAcquisition),
    nebenkosten: round(nebenkosten),
    starting_loan: round(loan0),
    monthly_annuity: round(monthlyAnnuity),
  },
  horizons: results,
  break_even_year: breakEven,
  notes: "Buy-to-live model. Positive 'buying_cheaper_by' means owning costs less over that horizon. Excludes income-tax effects and transaction costs on a future sale; treat as directional.",
}, null, 2));
