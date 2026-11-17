import { HAZARD_IDS } from "./scores.js";

export const WHEEL_SLICES = Object.freeze([
  { id: "bushfire", name: "Bushfire", color: "#FF7939" },
  { id: "flood", name: "Flood", color: "#6954AE" },
  { id: "stormSurge", name: "Storm Surge", color: "#34908B" },
  { id: "heatwave", name: "Heatwave", color: "#FF3B53" },
  { id: "biohazard", name: "Biohazard", color: "#BA6CD5" },
  { id: "mystery", name: "?", color: "#546E7A", isMystery: true },
]);

const UINT32_RANGE = 0x100000000;

function defaultGetRandomUint32() {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0];
}

export function pickRandomIndex(count, getRandomUint32 = defaultGetRandomUint32) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError("count must be a positive integer");
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % count);
  while (true) {
    const value = getRandomUint32() >>> 0;
    if (value < limit) {
      return value % count;
    }
  }
}

export function spinHazardWheel(
  hazardList = HAZARD_IDS,
  getRandomUint32 = defaultGetRandomUint32
) {
  if (!Array.isArray(hazardList) || hazardList.length === 0) {
    throw new RangeError("hazardList must be a non-empty array");
  }
  const count = hazardList.length;
  const index = pickRandomIndex(count, getRandomUint32);
  const chosen = hazardList[index];
  const hazardId = typeof chosen === "string" ? chosen : chosen.id;

  const sliceAngle = 360 / count;
  const sliceCenter = index * sliceAngle + sliceAngle / 2;
  const rotationDegrees = 360 * 5 + (360 - sliceCenter);

  return {
    index,
    hazardId,
    rotationDegrees,
  };
}
