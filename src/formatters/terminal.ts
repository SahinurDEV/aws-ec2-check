import type { InstanceDetails, OverallStatus } from "../types/ec2.js";

const RESET = "\u001b[0m";
const GREEN = "\u001b[32m";
const RED = "\u001b[31m";
const YELLOW = "\u001b[33m";
const BOLD = "\u001b[1m";
const DIM = "\u001b[2m";

export interface ColorOptions {
  color?: boolean;
}

export function shouldUseColor(explicit?: boolean): boolean {
  if (explicit === false) {
    return false;
  }
  if (explicit === true) {
    return true;
  }
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== "") {
    return false;
  }
  if (process.env.FORCE_COLOR === "0") {
    return false;
  }
  return Boolean(process.stdout.isTTY);
}

function colorize(text: string, code: string, enabled: boolean): string {
  if (!enabled) {
    return text;
  }
  return `${code}${text}${RESET}`;
}

function displayOrDash(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return value;
}

function formatOverallLabel(status: OverallStatus, color: boolean): string {
  const label = status.toUpperCase();
  switch (status) {
    case "healthy":
      return colorize(label, GREEN + BOLD, color);
    case "unhealthy":
      return colorize(label, RED + BOLD, color);
    default:
      return colorize(label, YELLOW + BOLD, color);
  }
}

function formatCheckLabel(status: string, color: boolean): string {
  switch (status) {
    case "passed":
      return colorize(status, GREEN, color);
    case "failed":
      return colorize(status, RED, color);
    case "initializing":
      return colorize(status, YELLOW, color);
    default:
      return colorize(status, DIM, color);
  }
}

function row(label: string, value: string, labelWidth = 18): string {
  return `${label.padEnd(labelWidth)} ${value}`;
}

export function formatInstanceTerminal(
  details: InstanceDetails,
  options: ColorOptions = {},
): string {
  const color = shouldUseColor(options.color);
  const lines: string[] = [];

  lines.push(colorize("EC2 Instance Health", BOLD, color));
  lines.push("");
  lines.push(row("Instance ID", details.instanceId));
  if (details.name) {
    lines.push(row("Name", details.name));
  }
  lines.push(row("State", details.state));
  lines.push(row("Instance Type", displayOrDash(details.instanceType)));
  lines.push(row("Region", details.region));
  lines.push(row("Availability", displayOrDash(details.availabilityZone)));
  lines.push(row("Public IP", displayOrDash(details.publicIp)));
  lines.push(row("Private IP", displayOrDash(details.privateIp)));
  lines.push(row("Private DNS", displayOrDash(details.privateDns)));
  lines.push(row("AMI ID", displayOrDash(details.amiId)));
  lines.push(row("Launch Time", displayOrDash(details.launchTime)));
  lines.push(row("VPC ID", displayOrDash(details.vpcId)));
  lines.push(row("Subnet ID", displayOrDash(details.subnetId)));
  lines.push(
    row(
      "Security Groups",
      details.securityGroups.length > 0 ? details.securityGroups.join(", ") : "-",
    ),
  );
  lines.push("");
  lines.push(row("System Check", formatCheckLabel(details.health.systemStatus, color)));
  lines.push(row("Instance Check", formatCheckLabel(details.health.instanceStatus, color)));
  lines.push("");
  lines.push(row("Overall Status", formatOverallLabel(details.overallStatus, color)));

  return `${lines.join("\n")}\n`;
}

export function formatErrorTerminal(message: string, debugDetails?: string, debug = false): string {
  const parts = [message.trim()];
  if (debug && debugDetails) {
    parts.push("");
    parts.push("Debug details:");
    parts.push(debugDetails);
  }
  return `${parts.join("\n")}\n`;
}
