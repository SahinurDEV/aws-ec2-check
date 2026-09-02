import type { Ec2Service } from "../../aws/ec2.js";
import { toJsonString } from "../../formatters/json.js";
import { formatTable } from "../../formatters/table.js";
import type { InstanceSummary, ListFilters } from "../../types/ec2.js";
import { ExitCode, type ExitCodeValue } from "../../utils/errors.js";
import { parseStateFilter, parseTagFilter } from "../../utils/validation.js";

export interface ListCommandOptions {
  json?: boolean;
  state?: string;
  name?: string;
  tag?: string;
}

export interface ListCommandResult {
  output: string;
  exitCode: ExitCodeValue;
  instances: InstanceSummary[];
}

export async function runListCommand(
  service: Ec2Service,
  options: ListCommandOptions = {},
): Promise<ListCommandResult> {
  const filters: ListFilters = {};

  if (options.state) {
    filters.state = parseStateFilter(options.state);
  }
  if (options.name) {
    filters.name = options.name;
  }
  if (options.tag) {
    filters.tag = parseTagFilter(options.tag);
  }

  const instances = await service.listInstances(filters);

  if (options.json) {
    return {
      output: toJsonString(instances),
      exitCode: ExitCode.Success,
      instances,
    };
  }

  const output = formatTable(
    [
      { key: "instanceId", header: "Instance ID", minWidth: 19 },
      { key: "name", header: "Name", minWidth: 12 },
      { key: "state", header: "State", minWidth: 8 },
      { key: "instanceType", header: "Type", minWidth: 8 },
      { key: "availabilityZone", header: "AZ", minWidth: 10 },
    ],
    instances.map((instance) => ({
      instanceId: instance.instanceId,
      name: instance.name,
      state: instance.state,
      instanceType: instance.instanceType,
      availabilityZone: instance.availabilityZone,
    })),
  );

  return {
    output: `${output}\n`,
    exitCode: ExitCode.Success,
    instances,
  };
}
