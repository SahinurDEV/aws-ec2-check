# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-09-02

### Added

- Check a single EC2 instance for state, networking, metadata, and status checks
- `list` command with table output and `--state`, `--name`, and `--tag` filters
- `--region`, `--json`, `--debug`, and `--no-color` options
- Exit codes: `0` success/healthy, `1` failure/unhealthy, `2` invalid usage
- Least-privilege IAM policy documentation (`docs/iam-policy.json`)
- Unit tests with mocked AWS SDK responses
- Optional opt-in integration tests
- GitHub Actions CI and release workflows
