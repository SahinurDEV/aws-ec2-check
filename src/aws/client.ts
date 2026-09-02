import { EC2Client } from "@aws-sdk/client-ec2";

export interface CreateEc2ClientOptions {
  region?: string;
}

/**
 * Creates an EC2 client using the AWS SDK default credential provider chain.
 * Region resolution order when --region is omitted:
 * AWS_REGION / AWS_DEFAULT_REGION → shared config → IMDS (when available).
 */
export function createEc2Client(options: CreateEc2ClientOptions = {}): EC2Client {
  const config: ConstructorParameters<typeof EC2Client>[0] = {};
  if (options.region) {
    config.region = options.region;
  }
  return new EC2Client(config);
}

export async function resolveClientRegion(client: EC2Client): Promise<string> {
  return client.config.region();
}
