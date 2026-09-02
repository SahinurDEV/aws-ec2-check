import { describe, expect, it } from "vitest";
import {
  assertValidInstanceId,
  isValidInstanceId,
  parseStateFilter,
  parseTagFilter,
} from "../../src/utils/validation.js";
import { UsageError } from "../../src/utils/errors.js";

describe("isValidInstanceId", () => {
  it("accepts classic 8-hex and modern 17-hex IDs", () => {
    expect(isValidInstanceId("i-12345678")).toBe(true);
    expect(isValidInstanceId("i-0123456789abcdef0")).toBe(true);
    expect(isValidInstanceId("I-0123456789ABCDEF0")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidInstanceId("")).toBe(false);
    expect(isValidInstanceId("i-123")).toBe(false);
    expect(isValidInstanceId("instance-0123456789abcdef0")).toBe(false);
    expect(isValidInstanceId("i-0123456789abcdefg")).toBe(false);
  });
});

describe("assertValidInstanceId", () => {
  it("returns trimmed valid IDs", () => {
    expect(assertValidInstanceId("  i-0123456789abcdef0  ")).toBe("i-0123456789abcdef0");
  });

  it("throws UsageError for invalid IDs", () => {
    expect(() => assertValidInstanceId("bad")).toThrow(UsageError);
  });
});

describe("parseTagFilter", () => {
  it("parses Key=Value", () => {
    expect(parseTagFilter("Environment=production")).toEqual({
      key: "Environment",
      value: "production",
    });
  });

  it("allows equals in the value", () => {
    expect(parseTagFilter("Note=a=b")).toEqual({ key: "Note", value: "a=b" });
  });

  it("rejects malformed tags", () => {
    expect(() => parseTagFilter("Environment")).toThrow(UsageError);
    expect(() => parseTagFilter("=value")).toThrow(UsageError);
    expect(() => parseTagFilter("key=")).toThrow(UsageError);
  });
});

describe("parseStateFilter", () => {
  it("normalizes valid states", () => {
    expect(parseStateFilter("Running")).toBe("running");
    expect(parseStateFilter("stopped")).toBe("stopped");
  });

  it("rejects unknown states", () => {
    expect(() => parseStateFilter("flying")).toThrow(UsageError);
  });
});
