/**
 * Exit codes for aws-ec2-check.
 * 0 = success / healthy
 * 1 = unhealthy instance or operational failure
 * 2 = invalid CLI usage
 */
export const ExitCode = {
  Success: 0,
  Failure: 1,
  Usage: 2,
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];

export class AppError extends Error {
  readonly exitCode: ExitCodeValue;
  readonly details?: string;

  constructor(message: string, exitCode: ExitCodeValue = ExitCode.Failure, details?: string) {
    super(message);
    this.name = "AppError";
    this.exitCode = exitCode;
    this.details = details;
  }
}

export class UsageError extends AppError {
  constructor(message: string, details?: string) {
    super(message, ExitCode.Usage, details);
    this.name = "UsageError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Maps AWS SDK / service errors to user-facing AppError messages.
 * Never includes credentials or secret material.
 */
export function mapAwsError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  const message = getErrorMessage(error);
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";

  let code = "";
  if (typeof error === "object" && error !== null) {
    if ("Code" in error) {
      code = String((error as { Code: unknown }).Code);
    } else if ("code" in error) {
      code = String((error as { code: unknown }).code);
    }
  }

  const combined = `${name} ${code} ${message}`.toLowerCase();

  if (
    combined.includes("accessdenied") ||
    combined.includes("unauthorized") ||
    combined.includes("not authorized") ||
    combined.includes("authorizationerror")
  ) {
    return new AppError(
      "Error: AWS denied this request.\n\nCheck that your IAM identity has the required EC2 read permissions.\nSee docs/iam-policy.json for the minimum recommended policy.",
      ExitCode.Failure,
      message,
    );
  }

  if (
    combined.includes("credential") ||
    combined.includes("could not load credentials") ||
    combined.includes("unable to locate credentials") ||
    combined.includes("expiredtoken") ||
    combined.includes("invalidtoken")
  ) {
    return new AppError(
      "Error: AWS credentials were not found or are invalid.\n\nConfigure credentials with one of:\n  aws configure\n  AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY environment variables\n  An IAM role (EC2, ECS, Lambda, etc.)",
      ExitCode.Failure,
      message,
    );
  }

  if (combined.includes("region is missing") || combined.includes("region is not defined")) {
    return new AppError(
      "Error: AWS region is missing.\n\nPass --region <region> or set AWS_REGION / AWS_DEFAULT_REGION\n(or configure a default region with `aws configure`).",
      ExitCode.Failure,
      message,
    );
  }

  if (combined.includes("invalidinstanceid") || combined.includes("invalid instance id")) {
    return new AppError(
      "Error: Invalid EC2 instance ID.\nExpected format: i-xxxxxxxxxxxxxxxxx",
      ExitCode.Usage,
      message,
    );
  }

  if (combined.includes("enotfound") || combined.includes("networkingerror")) {
    return new AppError(
      "Error: Unable to reach the AWS EC2 API.\n\nCheck your network connection and region setting.",
      ExitCode.Failure,
      message,
    );
  }

  return new AppError(`Error: ${message}`, ExitCode.Failure, message);
}
