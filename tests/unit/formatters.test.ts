import { describe, expect, it } from "vitest";
import { formatTable } from "../../src/formatters/table.js";
import { formatInstanceTerminal, shouldUseColor } from "../../src/formatters/terminal.js";
import type { InstanceDetails } from "../../src/types/ec2.js";

const details: InstanceDetails = {
  instanceId: "i-0123456789abcdef0",
  name: "api",
  state: "running",
  instanceType: "t3.medium",
  region: "us-east-1",
  availabilityZone: "us-east-1a",
  publicIp: "18.0.0.1",
  privateIp: "10.0.0.5",
  privateDns: "ip-10-0-0-5.ec2.internal",
  amiId: "ami-123",
  launchTime: "2024-01-15T12:00:00.000Z",
  vpcId: "vpc-abc",
  subnetId: "subnet-xyz",
  securityGroups: ["web"],
  health: { systemStatus: "passed", instanceStatus: "passed" },
  overallStatus: "healthy",
};

describe("formatTable", () => {
  it("renders aligned headers and rows", () => {
    const table = formatTable(
      [
        { key: "instanceId", header: "Instance ID" },
        { key: "state", header: "State" },
      ],
      [
        { instanceId: "i-1", state: "running" },
        { instanceId: "i-2", state: "stopped" },
      ],
    );
    expect(table).toContain("INSTANCE ID");
    expect(table).toContain("i-1");
    expect(table).toContain("stopped");
  });

  it("handles empty results", () => {
    expect(formatTable([{ key: "id", header: "ID" }], [])).toBe("No instances found.");
  });
});

describe("formatInstanceTerminal", () => {
  it("includes health labels as text", () => {
    const output = formatInstanceTerminal(details, { color: false });
    expect(output).toContain("EC2 Instance Health");
    expect(output).toContain("System Check");
    expect(output).toContain("passed");
    expect(output).toContain("HEALTHY");
    expect(output).not.toContain("\u001b");
  });

  it("shows UNHEALTHY without relying only on color", () => {
    const output = formatInstanceTerminal(
      {
        ...details,
        overallStatus: "unhealthy",
        health: { systemStatus: "failed", instanceStatus: "passed" },
      },
      { color: false },
    );
    expect(output).toContain("UNHEALTHY");
    expect(output).toContain("failed");
  });
});

describe("shouldUseColor", () => {
  it("respects NO_COLOR", () => {
    const previous = process.env.NO_COLOR;
    process.env.NO_COLOR = "1";
    expect(shouldUseColor()).toBe(false);
    if (previous === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = previous;
    }
  });
});
