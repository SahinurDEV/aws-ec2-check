import { UsageError } from "./errors.js";

/** EC2 instance IDs: i- followed by 8–17 hex characters (current AWS format uses 17). */
const INSTANCE_ID_PATTERN = /^i-[0-9a-f]{8,17}$/i;

export function isValidInstanceId(instanceId: string): boolean {
  return INSTANCE_ID_PATTERN.test(instanceId.trim());
}

export function assertValidInstanceId(instanceId: string): string {
  const trimmed = instanceId.trim();
  if (!isValidInstanceId(trimmed)) {
    throw new UsageError("Error: Invalid EC2 instance ID.\nExpected format: i-xxxxxxxxxxxxxxxxx");
  }
  return trimmed;
}

export function parseTagFilter(raw: string): { key: string; value: string } {
  const separator = raw.indexOf("=");
  if (separator <= 0 || separator === raw.length - 1) {
    throw new UsageError(
      "Error: Invalid --tag format.\nExpected: --tag Key=Value\nExample: --tag Environment=production",
    );
  }
  const key = raw.slice(0, separator).trim();
  const value = raw.slice(separator + 1).trim();
  if (!key || !value) {
    throw new UsageError(
      "Error: Invalid --tag format.\nExpected: --tag Key=Value\nExample: --tag Environment=production",
    );
  }
  return { key, value };
}

export function parseStateFilter(state: string): string {
  const normalized = state.trim().toLowerCase();
  const allowed = new Set([
    "pending",
    "running",
    "shutting-down",
    "terminated",
    "stopping",
    "stopped",
  ]);
  if (!allowed.has(normalized)) {
    throw new UsageError(
      `Error: Invalid --state value "${state}".\nAllowed: pending, running, shutting-down, terminated, stopping, stopped`,
    );
  }
  return normalized;
}
