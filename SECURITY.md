# Security Policy

## Supported versions

Security fixes are accepted for the latest published release of `aws-ec2-check`.

## Reporting a vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

Please report privately via GitHub Security Advisories on the repository (preferred), or by contacting the maintainer privately.

Include:

- A description of the issue
- Steps to reproduce (without secrets)
- Impact assessment if known

## Credentials and secrets

- Never submit AWS access keys, secret keys, session tokens, or passwords
- Never commit `.env` files or credential files
- Never paste secrets into issues, pull requests, or discussions
- This CLI uses the AWS SDK credential provider chain and does not store credentials

## Dependency hygiene

- Keep dependencies reasonably up to date
- Review `npm audit` findings before releases
- Prefer least-privilege IAM (see `docs/iam-policy.json`)

## Scope notes

This project is a read-only EC2 inspection CLI. Privilege escalation in recommended IAM policies, credential leakage in logs/errors, or supply-chain issues in published packages are in scope.
