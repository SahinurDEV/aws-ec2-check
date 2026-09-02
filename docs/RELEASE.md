# Release process

## npm publish (manual / GitHub Actions)

1. Update `version` in `package.json` and add a `CHANGELOG.md` entry.
2. Commit and tag:

```bash
git tag v0.1.0
git push origin main --tags
```

3. Create a GitHub Release from the tag, **or** run the `Release` workflow.

4. Ensure the repository secret `NPM_TOKEN` is set (npm access token with publish rights).

5. The workflow runs typecheck, lint, tests, build, and `npm pack`, then publishes with:

```bash
npm publish --access public
```

## Local dry run

```bash
npm run build
npm pack
tar -tzf aws-ec2-check-*.tgz
```

Do not commit the generated `.tgz` file.
