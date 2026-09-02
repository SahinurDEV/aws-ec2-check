export { createEc2Client } from "./aws/client.js";
export { createEc2Service, transformInstanceDetails, transformInstanceSummary } from "./aws/ec2.js";
export { runCheckCommand } from "./cli/commands/check.js";
export { runListCommand } from "./cli/commands/list.js";
export { formatInstanceJson } from "./formatters/json.js";
export { formatTable } from "./formatters/table.js";
export { formatInstanceTerminal } from "./formatters/terminal.js";
export type {
  InstanceDetails,
  InstanceHealth,
  InstanceSummary,
  ListFilters,
  OverallStatus,
} from "./types/ec2.js";
export { ExitCode, AppError } from "./utils/errors.js";
export { calculateOverallStatus, mapAwsStatusToCheck } from "./utils/health.js";
export { assertValidInstanceId, isValidInstanceId } from "./utils/validation.js";
