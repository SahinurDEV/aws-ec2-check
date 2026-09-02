export type OverallStatus = "healthy" | "unhealthy" | "unknown";

export type CheckStatus = "passed" | "failed" | "initializing" | "insufficient-data" | "unknown";

export interface InstanceHealth {
  systemStatus: CheckStatus;
  instanceStatus: CheckStatus;
}

export interface InstanceDetails {
  instanceId: string;
  name: string | null;
  state: string;
  instanceType: string | null;
  region: string;
  availabilityZone: string | null;
  publicIp: string | null;
  privateIp: string | null;
  privateDns: string | null;
  amiId: string | null;
  launchTime: string | null;
  vpcId: string | null;
  subnetId: string | null;
  securityGroups: string[];
  health: InstanceHealth;
  overallStatus: OverallStatus;
}

export interface InstanceSummary {
  instanceId: string;
  name: string | null;
  state: string;
  instanceType: string | null;
  availabilityZone: string | null;
}

export interface ListFilters {
  state?: string;
  name?: string;
  tag?: { key: string; value: string };
}

export interface JsonInstanceOutput {
  instanceId: string;
  name: string | null;
  state: string;
  instanceType: string | null;
  region: string;
  availabilityZone: string | null;
  publicIp: string | null;
  privateIp: string | null;
  privateDns: string | null;
  amiId: string | null;
  launchTime: string | null;
  vpcId: string | null;
  subnetId: string | null;
  securityGroups: string[];
  health: {
    systemStatus: string;
    instanceStatus: string;
  };
  overallStatus: OverallStatus;
}
