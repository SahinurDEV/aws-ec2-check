import { describe, expect, it, vi } from "vitest";
import { createEc2Service } from "../../src/aws/ec2.js";
import type { EC2Client } from "@aws-sdk/client-ec2";

function mockClient(handler: (command: { constructor: { name: string } }) => unknown): EC2Client {
  return {
    send: vi.fn(async (command: { constructor: { name: string } }) => handler(command)),
    config: {
      region: async () => "us-east-1",
    },
  } as unknown as EC2Client;
}

describe("createEc2Service", () => {
  it("returns instance details for a found instance", async () => {
    const client = mockClient((command) => {
      if (command.constructor.name === "DescribeInstancesCommand") {
        return {
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: "i-0123456789abcdef0",
                  InstanceType: "t3.small",
                  State: { Name: "running" },
                  Placement: { AvailabilityZone: "us-east-1a" },
                  PrivateIpAddress: "10.0.0.1",
                  Tags: [{ Key: "Name", Value: "web" }],
                },
              ],
            },
          ],
        };
      }
      return {
        InstanceStatuses: [
          {
            SystemStatus: { Status: "ok" },
            InstanceStatus: { Status: "ok" },
          },
        ],
      };
    });

    const service = createEc2Service(client);
    const details = await service.getInstance("i-0123456789abcdef0");
    expect(details.state).toBe("running");
    expect(details.overallStatus).toBe("healthy");
    expect(details.region).toBe("us-east-1");
  });

  it("throws when instance is missing", async () => {
    const client = mockClient(() => ({ Reservations: [] }));
    const service = createEc2Service(client);
    await expect(service.getInstance("i-0123456789abcdef0")).rejects.toThrow("not found");
  });

  it("paginates list results and applies filters", async () => {
    const pages = [
      {
        NextToken: "page-2",
        Reservations: [
          {
            Instances: [
              {
                InstanceId: "i-aaa",
                State: { Name: "running" },
                InstanceType: "t3.micro",
                Placement: { AvailabilityZone: "us-east-1a" },
                Tags: [{ Key: "Name", Value: "Production API" }],
              },
            ],
          },
        ],
      },
      {
        Reservations: [
          {
            Instances: [
              {
                InstanceId: "i-bbb",
                State: { Name: "running" },
                InstanceType: "t3.small",
                Placement: { AvailabilityZone: "us-east-1b" },
                Tags: [{ Key: "Name", Value: "Staging API" }],
              },
            ],
          },
        ],
      },
    ];

    const client = {
      send: vi.fn(async (command: { input?: { NextToken?: string } }) => {
        if (command.constructor.name !== "DescribeInstancesCommand") {
          return {};
        }
        const token = command.input?.NextToken;
        if (!token) {
          return pages[0];
        }
        return pages[1];
      }),
      config: {
        region: async () => "us-east-1",
      },
    } as unknown as EC2Client;

    const service = createEc2Service(client);
    const all = await service.listInstances();
    expect(all).toHaveLength(2);
    expect(client.send).toHaveBeenCalledTimes(2);

    const filtered = await service.listInstances({ name: "Production" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.instanceId).toBe("i-aaa");
  });
});
