import { describe, expect, it } from "vitest";
import { calculateOverallStatus, mapAwsStatusToCheck } from "../../src/utils/health.js";

describe("mapAwsStatusToCheck", () => {
  it("maps AWS status strings", () => {
    expect(mapAwsStatusToCheck("ok")).toBe("passed");
    expect(mapAwsStatusToCheck("impaired")).toBe("failed");
    expect(mapAwsStatusToCheck("initializing")).toBe("initializing");
    expect(mapAwsStatusToCheck("insufficient-data")).toBe("insufficient-data");
    expect(mapAwsStatusToCheck("not-applicable")).toBe("unknown");
    expect(mapAwsStatusToCheck(undefined)).toBe("unknown");
  });
});

describe("calculateOverallStatus", () => {
  it("returns healthy when both checks passed and instance is running", () => {
    expect(calculateOverallStatus("passed", "passed", "running")).toBe("healthy");
  });

  it("returns unhealthy when any check failed", () => {
    expect(calculateOverallStatus("failed", "passed", "running")).toBe("unhealthy");
    expect(calculateOverallStatus("passed", "failed", "running")).toBe("unhealthy");
  });

  it("returns unknown for non-running instances", () => {
    expect(calculateOverallStatus("passed", "passed", "stopped")).toBe("unknown");
    expect(calculateOverallStatus("unknown", "unknown", "terminated")).toBe("unknown");
  });

  it("returns unknown while initializing", () => {
    expect(calculateOverallStatus("initializing", "initializing", "running")).toBe("unknown");
  });
});
