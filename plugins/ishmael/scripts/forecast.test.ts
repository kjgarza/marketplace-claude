import { expect, test } from "bun:test";
import { deriveGear } from "./forecast.ts";

test("hot dry day → fan + cap, no umbrella", () => {
  expect(deriveGear({ t_max: 34, t_min: 22, precip_prob_max: 10 }))
    .toEqual({ umbrella: false, fan: true, cap_sunglasses: true, layers: false });
});

test("rainy day → umbrella, no cap", () => {
  expect(deriveGear({ t_max: 19, t_min: 14, precip_prob_max: 70 }))
    .toEqual({ umbrella: true, fan: false, cap_sunglasses: false, layers: false });
});

test("big swing cool morning → layers", () => {
  expect(deriveGear({ t_max: 24, t_min: 9, precip_prob_max: 15 }))
    .toEqual({ umbrella: false, fan: false, cap_sunglasses: true, layers: true });
});
