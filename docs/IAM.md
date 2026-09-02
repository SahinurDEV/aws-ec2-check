# IAM permissions for aws-ec2-check

This CLI is **read-only**. It never starts, stops, terminates, or modifies EC2 instances.

## Minimum policy

Use the policy in [`iam-policy.json`](./iam-policy.json).

| Permission                   | Why it is required                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `ec2:DescribeInstances`      | Read instance metadata (state, type, IPs, VPC, security groups, tags) for `check` and `list` |
| `ec2:DescribeInstanceStatus` | Read system and instance status checks for health reporting                                  |

## What this policy cannot do

With only these permissions, the identity **cannot**:

- Start, stop, reboot, or terminate instances
- Create or modify security groups, volumes, or networking
- Access other AWS services
- Read secrets or credentials from AWS

## Least privilege notes

- EC2 describe APIs require `"Resource": "*"` in IAM; resource-level ARNs are not supported for these actions.
- Do **not** attach `AdministratorAccess` or `ec2:*` for this tool.
- Prefer an IAM user/role dedicated to inspection, separate from deploy credentials.

## Attach the policy

1. Create an IAM policy from `iam-policy.json`.
2. Attach it to the IAM user or role used by your AWS CLI / SDK credentials.
3. Verify:

```bash
aws-ec2-check list --region us-east-1
```
