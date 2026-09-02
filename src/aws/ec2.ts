import {
  DescribeInstanceStatusCommand,
  DescribeInstancesCommand,
  type EC2Client,
  type Filter,
  type Instance,
  type InstanceStatus,
  type Reservation,
} from "@aws-sdk/client-ec2";
import type { InstanceDetails, InstanceSummary, ListFilters } from "../types/ec2.js";
import { AppError, ExitCode, mapAwsError } from "../utils/errors.js";
import { calculateOverallStatus, getTagValue, mapAwsStatusToCheck } from "../utils/health.js";
import { resolveClientRegion } from "./client.js";

export interface Ec2Service {
  getInstance(instanceId: string): Promise<InstanceDetails>;
  listInstances(filters?: ListFilters): Promise<InstanceSummary[]>;
}

export function createEc2Service(client: EC2Client): Ec2Service {
  return {
    async getInstance(instanceId: string): Promise<InstanceDetails> {
      try {
        const region = await resolveClientRegion(client);

        const describeResult = await client.send(
          new DescribeInstancesCommand({
            InstanceIds: [instanceId],
          }),
        );

        const instance = extractFirstInstance(describeResult.Reservations);
        if (!instance?.InstanceId) {
          throw new AppError(
            "Error: EC2 instance was not found.\n\nCheck:\n- Instance ID\n- AWS region\n- AWS account",
            ExitCode.Failure,
          );
        }

        let status: InstanceStatus | undefined;
        try {
          const statusResult = await client.send(
            new DescribeInstanceStatusCommand({
              InstanceIds: [instanceId],
              IncludeAllInstances: true,
            }),
          );
          status = statusResult.InstanceStatuses?.[0];
        } catch (statusError) {
          // If status lookup fails after describe succeeded, surface mapped error
          throw mapAwsError(statusError);
        }

        return transformInstanceDetails(instance, status, region);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        const mapped = mapAwsError(error);
        // AWS returns InvalidInstanceID.NotFound for missing IDs
        const raw = error instanceof Error ? error.message : String(error);
        const name =
          typeof error === "object" && error !== null && "name" in error
            ? String((error as { name: unknown }).name)
            : "";
        if (
          name.includes("InvalidInstanceID.NotFound") ||
          raw.toLowerCase().includes("does not exist")
        ) {
          throw new AppError(
            "Error: EC2 instance was not found.\n\nCheck:\n- Instance ID\n- AWS region\n- AWS account",
            ExitCode.Failure,
            raw,
          );
        }
        throw mapped;
      }
    },

    async listInstances(filters: ListFilters = {}): Promise<InstanceSummary[]> {
      try {
        const awsFilters = buildListFilters(filters);
        const instances: Instance[] = [];
        let nextToken: string | undefined;

        do {
          const result = await client.send(
            new DescribeInstancesCommand({
              Filters: awsFilters.length > 0 ? awsFilters : undefined,
              NextToken: nextToken,
            }),
          );

          for (const reservation of result.Reservations ?? []) {
            for (const instance of reservation.Instances ?? []) {
              if (instance.InstanceId) {
                instances.push(instance);
              }
            }
          }
          nextToken = result.NextToken;
        } while (nextToken);

        let summaries = instances.map(transformInstanceSummary);

        // Name filter is applied client-side for case-insensitive substring match.
        if (filters.name) {
          const needle = filters.name.toLowerCase();
          summaries = summaries.filter(
            (item) => item.name !== null && item.name.toLowerCase().includes(needle),
          );
        }

        summaries.sort((a, b) => a.instanceId.localeCompare(b.instanceId));
        return summaries;
      } catch (error) {
        throw mapAwsError(error);
      }
    },
  };
}

function extractFirstInstance(reservations: Reservation[] | undefined): Instance | undefined {
  for (const reservation of reservations ?? []) {
    const instance = reservation.Instances?.[0];
    if (instance) {
      return instance;
    }
  }
  return undefined;
}

function buildListFilters(filters: ListFilters): Filter[] {
  const result: Filter[] = [];

  if (filters.state) {
    result.push({ Name: "instance-state-name", Values: [filters.state] });
  }

  if (filters.tag) {
    result.push({ Name: `tag:${filters.tag.key}`, Values: [filters.tag.value] });
  }

  return result;
}

export function transformInstanceSummary(instance: Instance): InstanceSummary {
  return {
    instanceId: instance.InstanceId ?? "unknown",
    name: getTagValue(instance.Tags, "Name"),
    state: instance.State?.Name ?? "unknown",
    instanceType: instance.InstanceType ?? null,
    availabilityZone: instance.Placement?.AvailabilityZone ?? null,
  };
}

export function transformInstanceDetails(
  instance: Instance,
  status: InstanceStatus | undefined,
  region: string,
): InstanceDetails {
  const state = instance.State?.Name ?? "unknown";
  const systemStatus = mapAwsStatusToCheck(status?.SystemStatus?.Status);
  const instanceStatus = mapAwsStatusToCheck(status?.InstanceStatus?.Status);
  const overallStatus = calculateOverallStatus(systemStatus, instanceStatus, state);

  return {
    instanceId: instance.InstanceId ?? "unknown",
    name: getTagValue(instance.Tags, "Name"),
    state,
    instanceType: instance.InstanceType ?? null,
    region,
    availabilityZone: instance.Placement?.AvailabilityZone ?? null,
    publicIp: instance.PublicIpAddress ?? null,
    privateIp: instance.PrivateIpAddress ?? null,
    privateDns: instance.PrivateDnsName ?? null,
    amiId: instance.ImageId ?? null,
    launchTime: instance.LaunchTime ? instance.LaunchTime.toISOString() : null,
    vpcId: instance.VpcId ?? null,
    subnetId: instance.SubnetId ?? null,
    securityGroups: (instance.SecurityGroups ?? [])
      .map((sg) => sg.GroupName ?? sg.GroupId ?? "")
      .filter(Boolean),
    health: {
      systemStatus,
      instanceStatus,
    },
    overallStatus,
  };
}

/** Exported for unit tests that exercise pagination assembly without a live client. */
export function collectInstancesFromPages(
  pages: Array<{ Reservations?: Reservation[]; NextToken?: string }>,
): Instance[] {
  const instances: Instance[] = [];
  for (const page of pages) {
    for (const reservation of page.Reservations ?? []) {
      for (const instance of reservation.Instances ?? []) {
        if (instance.InstanceId) {
          instances.push(instance);
        }
      }
    }
  }
  return instances;
}
