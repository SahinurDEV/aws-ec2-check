import type { InstanceDetails, JsonInstanceOutput } from "../types/ec2.js";

export function formatInstanceJson(details: InstanceDetails): JsonInstanceOutput {
  return {
    instanceId: details.instanceId,
    name: details.name,
    state: details.state,
    instanceType: details.instanceType,
    region: details.region,
    availabilityZone: details.availabilityZone,
    publicIp: details.publicIp,
    privateIp: details.privateIp,
    privateDns: details.privateDns,
    amiId: details.amiId,
    launchTime: details.launchTime,
    vpcId: details.vpcId,
    subnetId: details.subnetId,
    securityGroups: details.securityGroups,
    health: {
      systemStatus: details.health.systemStatus,
      instanceStatus: details.health.instanceStatus,
    },
    overallStatus: details.overallStatus,
  };
}

export function toJsonString(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
