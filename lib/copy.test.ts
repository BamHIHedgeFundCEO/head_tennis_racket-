import { describe, expect, it } from "vitest";
import { racquetName } from "./copy";

describe("racquetName", () => {
  it("does not repeat single-model lines (series === model)", () => {
    expect(racquetName("squared_squared")).toBe("HEAD SQUARED");
  });

  it("keeps series + model for normal lines", () => {
    expect(racquetName("radical_team")).toBe("HEAD Radical TEAM");
    expect(racquetName("gravity_mp_l")).toBe("HEAD Gravity MP L");
  });

  it("falls back to the id for an unknown racquet", () => {
    expect(racquetName("nope")).toBe("nope");
  });
});
