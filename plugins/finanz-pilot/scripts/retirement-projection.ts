#!/usr/bin/env bun
/**
 * retirement-projection — deterministic future-value projection across pension pillars.
 * Pure math so the LLM interprets results instead of doing error-prone arithmetic inline.
 * Implements the FV formula from references/three-pillar-methodology.md:
 *   FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r   (r = monthly return, n = months to retirement)
 *
 * Input: JSON on stdin or via --input '<json>':
 * {
 *   "current_age": 38, "retirement_age": 67,
 *   "pillars": [
 *     {"name":"ETF Sparplan","type":"capital","present_value":40000,"monthly_contribution":800,"annual_return_pct":6,"ter_pct":0.2},
 *     {"name":"bAV","type":"annuity","present_value":15000,"monthly_contribution":150,"annual_return_pct":3,"annuity_monthly_per_100k":350},
 *     {"name":"GRV","type":"fixed_monthly","fixed_monthly":1400}
 *   ],
 *   "withdrawal_rate_pct": 4
 * }
 *
 * Output: per-pillar future value at retirement + estimated gross monthly income.
 *   capital pillars  -> 4% rule (or withdrawal_rate_pct)
 *   annuity pillars  -> annuity_monthly_per_100k applied to FV
 *   fixed_monthly    -> passthrough
 */
function readInput(): any {
  const i = process.argv.indexOf("--input");
  const raw = i >= 0 ? process.argv[i + 1] : require("fs").readFileSync(0, "utf-8");
  return JSON.parse(raw);
}

function fv(pv: number, pmtMonthly: number, annualReturnPct: number, months: number): number {
  const r = annualReturnPct / 100 / 12;
  if (r === 0) return pv + pmtMonthly * months;
  const growth = Math.pow(1 + r, months);
  return pv * growth + pmtMonthly * ((growth - 1) / r);
}

const input = readInput();
const months = Math.max(0, (input.retirement_age - input.current_age)) * 12;
const wr = (input.withdrawal_rate_pct ?? 4) / 100;

let totalFV = 0;
let totalMonthlyIncome = 0;
const pillars = (input.pillars ?? []).map((p: any) => {
  if (p.type === "fixed_monthly") {
    totalMonthlyIncome += p.fixed_monthly ?? 0;
    return { name: p.name ?? "fixed", type: p.type, monthly_income: round(p.fixed_monthly ?? 0) };
  }
  const netReturn = (p.annual_return_pct ?? 0) - (p.ter_pct ?? 0);
  const value = fv(p.present_value ?? 0, p.monthly_contribution ?? 0, netReturn, months);
  totalFV += value;
  let monthly = 0;
  if (p.type === "annuity") {
    monthly = (value / 100000) * (p.annuity_monthly_per_100k ?? 350);
  } else {
    // capital pillar: withdrawal-rate rule
    monthly = (value * wr) / 12;
  }
  totalMonthlyIncome += monthly;
  return {
    name: p.name ?? "pillar",
    type: p.type,
    future_value: round(value),
    net_return_pct: round(netReturn),
    monthly_income: round(monthly),
  };
});

function round(n: number): number { return Math.round(n * 100) / 100; }

console.log(JSON.stringify({
  months_to_retirement: months,
  withdrawal_rate_pct: input.withdrawal_rate_pct ?? 4,
  pillars,
  total_capital_at_retirement: round(totalFV),
  estimated_gross_monthly_income: round(totalMonthlyIncome),
  notes: "Gross, pre-tax. Apply nachgelagerte Besteuerung + KV/PV per methodology. Capital pillars use the withdrawal-rate rule; annuities use the provided conversion factor.",
}, null, 2));
