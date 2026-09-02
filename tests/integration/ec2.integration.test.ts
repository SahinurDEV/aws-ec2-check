/**
 * Optional integration tests against a real AWS account.
 *
 * These do NOT run in normal CI. Enable explicitly:
 *
 *   AWS_EC2_CHECK_INTEGRATION=true npm run test:integration
 *
 * Requires:
 * - Valid AWS credentials in the default provider chain
 * - IAM permissions from docs/iam-policy.json
 * - Optional: AWS_EC2_CHECK_INSTANCE_ID and AWS_REGION
 */
import { describe, expect, it } from "vitest";
import { createEc2Client } from "../../src/aws/client.js";
import { createEc2Service } from "../../src/aws/ec2.js";

const enabled = process.env.AWS_EC2_CHECK_INTEGRATION === "true";

describe.runIf(enabled)("AWS integration", () => {
  it("lists instances with real credentials", async () => {
    const client = createEc2Client({
      region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION,
    });
    const service = createEc2Service(client);
    const instances = await service.listInstances();
    expect(Array.isArray(instances)).toBe(true);
  });

  it("checks a specific instance when AWS_EC2_CHECK_INSTANCE_ID is set", async () => {
    const instanceId = process.env.AWS_EC2_CHECK_INSTANCE_ID;
    if (!instanceId) {
      return;
    }
    const client = createEc2Client({
      region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION,
    });
    const service = createEc2Service(client);
    const details = await service.getInstance(instanceId);
    expect(details.instanceId).toBe(instanceId);
    expect(details.state).toBeTruthy();
  });
});

describe.runIf(!enabled)("AWS integration (skipped)", () => {
  it("documents how to enable integration tests", () => {
    expect(enabled).toBe(false);
  });
});
