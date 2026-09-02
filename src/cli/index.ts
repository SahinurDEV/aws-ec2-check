import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { createEc2Client } from "../aws/client.js";
import { createEc2Service } from "../aws/ec2.js";
import { formatErrorTerminal } from "../formatters/terminal.js";
import { ExitCode, isAppError, mapAwsError, type ExitCodeValue } from "../utils/errors.js";
import { runCheckCommand } from "./commands/check.js";
import { runListCommand } from "./commands/list.js";

export interface CliRuntime {
  stdout: { write: (chunk: string) => void };
  stderr: { write: (chunk: string) => void };
  exit: (code: number) => void;
}

function loadPackageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [join(here, "../../package.json"), join(here, "../../../package.json")];
  for (const candidate of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(candidate, "utf8")) as { version?: string };
      if (pkg.version) {
        return pkg.version;
      }
    } catch {
      // try next
    }
  }
  return "0.0.0";
}

const HELP_EPILOG = `
Examples:
  $ aws-ec2-check i-0123456789abcdef0
  $ aws-ec2-check i-0123456789abcdef0 --region us-east-1
  $ aws-ec2-check i-0123456789abcdef0 --json
  $ aws-ec2-check list
  $ aws-ec2-check list --state running
  $ aws-ec2-check list --name "Production API"
  $ aws-ec2-check list --tag Environment=production

Exit codes:
  0  Success / healthy
  1  Unhealthy instance or operational failure
  2  Invalid CLI usage

IAM:
  See docs/iam-policy.json for the minimum read-only permissions.
`;

export function createProgram(
  onCheck: (
    instanceId: string,
    options: { region?: string; json?: boolean; color?: boolean },
  ) => Promise<ExitCodeValue>,
  onList: (options: {
    region?: string;
    json?: boolean;
    state?: string;
    name?: string;
    tag?: string;
  }) => Promise<ExitCodeValue>,
): Command {
  const program = new Command();
  let pendingExit: ExitCodeValue = ExitCode.Success;

  program
    .name("aws-ec2-check")
    .description("Inspect AWS EC2 instance health and status from your terminal")
    .version(loadPackageVersion(), "-V, --version", "Show CLI version")
    .argument("[instance-id]", "EC2 instance ID (i-xxxxxxxxxxxxxxxxx)")
    .option("--region <region>", "AWS region (e.g. us-east-1)")
    .option("--json", "Output machine-readable JSON only", false)
    .option("--debug", "Show additional technical error details", false)
    .option("--no-color", "Disable ANSI colors")
    .action(async (instanceId: string | undefined, options) => {
      if (!instanceId) {
        program.outputHelp();
        pendingExit = ExitCode.Usage;
        return;
      }
      pendingExit = await onCheck(instanceId, options);
    });

  program
    .command("list")
    .description("List EC2 instances")
    .option("--region <region>", "AWS region (e.g. us-east-1)")
    .option("--json", "Output machine-readable JSON only", false)
    .option("--debug", "Show additional technical error details", false)
    .option("--state <state>", "Filter by instance state (e.g. running, stopped)")
    .option("--name <name>", "Filter by Name tag")
    .option("--tag <Key=Value>", "Filter by EC2 tag (e.g. Environment=production)")
    .option("--no-color", "Disable ANSI colors")
    .action(async (options) => {
      pendingExit = await onList(options);
    });

  program.addHelpText("after", HELP_EPILOG);

  (program as Command & { getPendingExit: () => ExitCodeValue }).getPendingExit = () => pendingExit;
  return program;
}

export async function runCli(
  argv: string[] = process.argv,
  runtime: CliRuntime = {
    stdout: process.stdout,
    stderr: process.stderr,
    exit: (code) => {
      process.exit(code);
    },
  },
): Promise<number> {
  let exitCode: ExitCodeValue = ExitCode.Success;

  const onCheck = async (
    instanceId: string,
    options: { region?: string; json?: boolean; color?: boolean },
  ): Promise<ExitCodeValue> => {
    const client = createEc2Client({ region: options.region });
    const service = createEc2Service(client);
    const result = await runCheckCommand(service, instanceId, {
      json: options.json,
      color: options.color,
    });
    runtime.stdout.write(result.output);
    return result.exitCode;
  };

  const onList = async (options: {
    region?: string;
    json?: boolean;
    state?: string;
    name?: string;
    tag?: string;
  }): Promise<ExitCodeValue> => {
    const client = createEc2Client({ region: options.region });
    const service = createEc2Service(client);
    const result = await runListCommand(service, {
      json: options.json,
      state: options.state,
      name: options.name,
      tag: options.tag,
    });
    runtime.stdout.write(result.output);
    return result.exitCode;
  };

  const program = createProgram(onCheck, onList);
  program.exitOverride();
  program.configureOutput({
    writeOut: (str) => {
      runtime.stdout.write(str);
    },
    writeErr: (str) => {
      runtime.stderr.write(str);
    },
  });

  try {
    await program.parseAsync(argv);
    exitCode =
      (program as Command & { getPendingExit?: () => ExitCodeValue }).getPendingExit?.() ??
      exitCode;
  } catch (error) {
    exitCode = handleCliError(error, argv, runtime);
  }

  runtime.exit(exitCode);
  return exitCode;
}

function handleCliError(error: unknown, argv: string[], runtime: CliRuntime): ExitCodeValue {
  if (
    error instanceof Error &&
    "code" in error &&
    ((error as { code?: string }).code === "commander.helpDisplayed" ||
      (error as { code?: string }).code === "commander.version")
  ) {
    return ExitCode.Success;
  }

  if (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: string }).code === "string" &&
    String((error as { code: string }).code).startsWith("commander.")
  ) {
    return ExitCode.Usage;
  }

  const appError = isAppError(error) ? error : mapAwsError(error);
  const debug = argv.includes("--debug");
  runtime.stderr.write(formatErrorTerminal(appError.message, appError.details, debug));
  return appError.exitCode;
}

// Intentionally no auto-run here. The published bin entry is ./cli/bin.js.
