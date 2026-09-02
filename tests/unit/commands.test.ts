import { describe, expect, it, vi } from "vitest";
import { runCheckCommand } from "../../src/cli/commands/check.js";
import { runListCommand } from "../../src/cli/commands/list.js";
import type { Ec2Service } from "../../src/aws/ec2.js";
import type { InstanceDetails, InstanceSummary } from "../../src/types/ec2.js";
import { ExitCode, UsageError } from "../../src/utils/errors.js";

const healthy: InstanceDetails = {
  instanceId: "i-0123456789abcdef0",
  name: "api",
  state: "running",
  instanceType: "t3.medium",
  region: "us-east-1",
  availabilityZone: "us-east-1a",
  publicIp: "18.0.0.1",
  privateIp: "10.0.0.5",
  privateDns: null,
  amiId: "ami-1",
  launchTime: null,
  vpcId: null,
  subnetId: null,
  securityGroups: [],
  health: { systemStatus: "passed", instanceStatus: "passed" },
  overallStatus: "healthy",
};

describe("runCheckCommand", () => {
  it("returns healthy exit code and terminal output", async () => {
    const service: Ec2Service = {
      getInstance: vi.fn(async () => healthy),
      listInstances: vi.fn(async () => []),
    };
    const result = await runCheckCommand(service, "i-0123456789abcdef0", { color: false });
    expect(result.exitCode).toBe(ExitCode.Success);
    expect(result.output).toContain("HEALTHY");
  });

  it("returns JSON only in json mode", async () => {
    const service: Ec2Service = {
      getInstance: vi.fn(async () => healthy),
      listInstances: vi.fn(async () => []),
    };
    const result = await runCheckCommand(service, "i-0123456789abcdef0", { json: true });
    const parsed = JSON.parse(result.output) as { overallStatus: string };
    expect(parsed.overallStatus).toBe("healthy");
    expect(result.output.trim().startsWith("{")).toBe(true);
  });

  it("returns failure exit code when unhealthy", async () => {
    const unhealthy: InstanceDetails = {
      ...healthy,
      overallStatus: "unhealthy",
      health: { systemStatus: "failed", instanceStatus: "passed" },
    };
    const service: Ec2Service = {
      getInstance: vi.fn(async () => unhealthy),
      listInstances: vi.fn(async () => []),
    };
    const result = await runCheckCommand(service, "i-0123456789abcdef0");
    expect(result.exitCode).toBe(ExitCode.Failure);
  });

  it("rejects invalid instance ids before calling AWS", async () => {
    const getInstance = vi.fn();
    const service: Ec2Service = {
      getInstance,
      listInstances: vi.fn(async () => []),
    };
    await expect(runCheckCommand(service, "nope")).rejects.toThrow(UsageError);
    expect(getInstance).not.toHaveBeenCalled();
  });
});

describe("runListCommand", () => {
  it("formats a table", async () => {
    const rows: InstanceSummary[] = [
      {
        instanceId: "i-1",
        name: "api",
        state: "running",
        instanceType: "t3.medium",
        availabilityZone: "us-east-1a",
      },
    ];
    const service: Ec2Service = {
      getInstance: vi.fn(),
      listInstances: vi.fn(async () => rows),
    };
    const result = await runListCommand(service);
    expect(result.exitCode).toBe(ExitCode.Success);
    expect(result.output).toContain("INSTANCE ID");
    expect(result.output).toContain("i-1");
  });

  it("supports json list output", async () => {
    const service: Ec2Service = {
      getInstance: vi.fn(),
      listInstances: vi.fn(async () => []),
    };
    const result = await runListCommand(service, { json: true });
    expect(JSON.parse(result.output)).toEqual([]);
  });
});
