import { describe, expect, it } from "vitest";
import { AppError, ExitCode, mapAwsError, UsageError } from "../../src/utils/errors.js";

describe("mapAwsError", () => {
  it("maps access denied errors", () => {
    const error = Object.assign(new Error("User is not authorized"), { name: "AccessDenied" });
    const mapped = mapAwsError(error);
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.message).toContain("AWS denied this request");
    expect(mapped.exitCode).toBe(ExitCode.Failure);
  });

  it("maps missing credentials", () => {
    const error = Object.assign(new Error("Could not load credentials from any providers"), {
      name: "CredentialsProviderError",
    });
    const mapped = mapAwsError(error);
    expect(mapped.message).toContain("credentials");
  });

  it("maps missing region", () => {
    const mapped = mapAwsError(new Error("Region is missing"));
    expect(mapped.message).toContain("region is missing");
    expect(mapped.message).toContain("--region");
  });

  it("maps invalid instance id from AWS", () => {
    const error = Object.assign(new Error("Invalid instance id"), {
      name: "InvalidInstanceID.Malformed",
    });
    const mapped = mapAwsError(error);
    expect(mapped.exitCode).toBe(ExitCode.Usage);
  });

  it("passes through AppError", () => {
    const original = new UsageError("bad input");
    expect(mapAwsError(original)).toBe(original);
  });

  it("wraps unknown errors", () => {
    const mapped = mapAwsError(new Error("boom"));
    expect(mapped.message).toContain("boom");
  });
});
