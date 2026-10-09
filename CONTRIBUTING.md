# Contributing to aws-ec2-check

Thanks for your interest in contributing.

## Development setup

1. Fork the repository on GitHub
2. Clone your fork:

```bash
git clone https://github.com/SahinurDEV/aws-ec2-check.git
cd aws-ec2-check
```

3. Install dependencies:

```bash
npm install
```

4. Create a branch:

```bash
git checkout -b feature/your-change
```

## Checks before opening a PR

Run all of the following:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

Unit tests must not require AWS credentials.

Optional integration tests:

```bash
AWS_EC2_CHECK_INTEGRATION=true npm run test:integration
```

## Pull request expectations

- Keep changes focused and documented when behavior changes
- Add or update unit tests for new logic
- Do not commit secrets, `.env` files, or AWS credentials
- Do not broaden IAM permissions without a clear justification
- Update `CHANGELOG.md` for user-visible changes

## Commit messages

Prefer concise, conventional messages:

```text
feat: add tag filter to list command
fix: handle paginated DescribeInstances responses
docs: clarify IAM least-privilege guidance
```

## Code style

- TypeScript strict mode
- ESLint + Prettier (run `npm run format` if needed)
- Prefer small modules over deep abstraction

## Questions

Open a GitHub Discussion or issue for design questions before large changes.
