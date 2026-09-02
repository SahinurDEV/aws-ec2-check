import type { CheckStatus, OverallStatus } from "../types/ec2.js";

/**
 * Maps AWS InstanceStatus.Details / Status.Status values to display labels.
 * AWS uses: ok, impaired, initializing, insufficient-data, not-applicable
 */
export function mapAwsStatusToCheck(status: string | undefined | null): CheckStatus {
  if (!status) {
    return "unknown";
  }
  switch (status.toLowerCase()) {
    case "ok":
      return "passed";
    case "impaired":
      return "failed";
    case "initializing":
      return "initializing";
    case "insufficient-data":
      return "insufficient-data";
    case "not-applicable":
      return "unknown";
    default:
      return "unknown";
  }
}

export function calculateOverallStatus(
  systemStatus: CheckStatus,
  instanceStatus: CheckStatus,
  instanceState?: string,
): OverallStatus {
  if (instanceState && instanceState !== "running") {
    return "unknown";
  }

  if (systemStatus === "failed" || instanceStatus === "failed") {
    return "unhealthy";
  }

  if (systemStatus === "passed" && instanceStatus === "passed") {
    return "healthy";
  }

  return "unknown";
}

export function getTagValue(
  tags: Array<{ Key?: string; Value?: string }> | undefined,
  key: string,
): string | null {
  if (!tags) {
    return null;
  }
  const match = tags.find((tag) => tag.Key === key);
  return match?.Value ?? null;
}
