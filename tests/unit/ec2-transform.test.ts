import { describe, expect, it } from "vitest";
import type { Instance } from "@aws-sdk/client-ec2";
import {
  collectInstancesFromPages,
  transformInstanceDetails,
  transformInstanceSummary,
} from "../../src/aws/ec2.js";
import { formatInstanceJson, toJsonString } from "../../src/formatters/json.js";

const sampleInstance: Instance = {
  InstanceId: "i-0123456789abcdef0",
  InstanceType: "t3.medium",
  State: { Name: "running" },
  Placement: { AvailabilityZone: "us-east-1a" },
  PublicIpAddress: "18.0.0.1",
  PrivateIpAddress: "10.0.0.5",
  PrivateDnsName: "ip-10-0-0-5.ec2.internal",
  ImageId: "ami-123",
  LaunchTime: new Date("2024-01-15T12:00:00.000Z"),
  VpcId: "vpc-abc",
  SubnetId: "subnet-xyz",
  SecurityGroups: [{ GroupName: "web", GroupId: "sg-1" }],
  Tags: [{ Key: "Name", Value: "api" }],
};

describe("transformInstanceDetails", () => {
  it("maps instance and status into details", () => {
    const details = transformInstanceDetails(
      sampleInstance,
      {
        SystemStatus: { Status: "ok" },
        InstanceStatus: { Status: "ok" },
      },
      "us-east-1",
    );

    expect(details.instanceId).toBe("i-0123456789abcdef0");
    expect(details.name).toBe("api");
    expect(details.region).toBe("us-east-1");
    expect(details.health.systemStatus).toBe("passed");
    expect(details.health.instanceStatus).toBe("passed");
    expect(details.overallStatus).toBe("healthy");
    expect(details.securityGroups).toEqual(["web"]);
  });

  it("marks impaired checks as unhealthy", () => {
    const details = transformInstanceDetails(
      sampleInstance,
      {
        SystemStatus: { Status: "impaired" },
        InstanceStatus: { Status: "ok" },
      },
      "us-east-1",
    );
    expect(details.overallStatus).toBe("unhealthy");
  });
});

describe("transformInstanceSummary", () => {
  it("maps list row fields", () => {
    expect(transformInstanceSummary(sampleInstance)).toEqual({
      instanceId: "i-0123456789abcdef0",
      name: "api",
      state: "running",
      instanceType: "t3.medium",
      availabilityZone: "us-east-1a",
    });
  });
});

describe("collectInstancesFromPages", () => {
  it("flattens paginated reservations", () => {
    const instances = collectInstancesFromPages([
      {
        Reservations: [{ Instances: [{ InstanceId: "i-1" }] }],
        NextToken: "next",
      },
      {
        Reservations: [{ Instances: [{ InstanceId: "i-2" }, { InstanceId: "i-3" }] }],
      },
    ]);
    expect(instances.map((i) => i.InstanceId)).toEqual(["i-1", "i-2", "i-3"]);
  });
});

describe("JSON formatting", () => {
  it("produces machine-readable JSON", () => {
    const details = transformInstanceDetails(
      sampleInstance,
      {
        SystemStatus: { Status: "ok" },
        InstanceStatus: { Status: "ok" },
      },
      "us-east-1",
    );
    const json = formatInstanceJson(details);
    expect(json.overallStatus).toBe("healthy");
    expect(json.health.systemStatus).toBe("passed");
    const text = toJsonString(json);
    expect(() => JSON.parse(text)).not.toThrow();
    expect(text).not.toContain("\u001b");
  });
});
