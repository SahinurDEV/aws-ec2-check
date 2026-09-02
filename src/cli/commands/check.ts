import type { Ec2Service } from "../../aws/ec2.js";
import { formatInstanceJson, toJsonString } from "../../formatters/json.js";
import { formatInstanceTerminal } from "../../formatters/terminal.js";
import type { InstanceDetails } from "../../types/ec2.js";
import { ExitCode, type ExitCodeValue } from "../../utils/errors.js";
import { assertValidInstanceId } from "../../utils/validation.js";

export interface CheckCommandOptions {
  json?: boolean;
  color?: boolean;
}

export interface CheckCommandResult {
  output: string;
  exitCode: ExitCodeValue;
  details: InstanceDetails;
}

export async function runCheckCommand(
  service: Ec2Service,
  instanceId: string,
  options: CheckCommandOptions = {},
): Promise<CheckCommandResult> {
  const validatedId = assertValidInstanceId(instanceId);
  const details = await service.getInstance(validatedId);

  const output = options.json
    ? toJsonString(formatInstanceJson(details))
    : formatInstanceTerminal(details, { color: options.color });

  const exitCode = details.overallStatus === "unhealthy" ? ExitCode.Failure : ExitCode.Success;

  return { output, exitCode, details };
}
