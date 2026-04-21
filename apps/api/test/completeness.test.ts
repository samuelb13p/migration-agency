import { describe, expect, it } from "vitest";

function calculateCompleteness(requiredIds: string[], uploadedIds: string[]) {
  const uploadedSet = new Set(uploadedIds);
  const missing = requiredIds.filter((id) => !uploadedSet.has(id));
  const completenessPercent =
    requiredIds.length === 0 ? 100 : Math.round(((requiredIds.length - missing.length) / requiredIds.length) * 100);

  return {
    completenessPercent,
    missing,
  };
}

describe("completeness engine logic", () => {
  it("returns 100% when all required document types are present", () => {
    expect(calculateCompleteness(["passport", "photo"], ["passport", "photo"])).toEqual({
      completenessPercent: 100,
      missing: [],
    });
  });

  it("identifies missing required documents", () => {
    expect(calculateCompleteness(["passport", "photo", "coe"], ["passport"])).toEqual({
      completenessPercent: 33,
      missing: ["photo", "coe"],
    });
  });
});
