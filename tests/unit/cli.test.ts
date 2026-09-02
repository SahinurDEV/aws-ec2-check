import { describe, expect, it, vi } from "vitest";
import { runCli } from "../../src/cli/index.js";
import { ExitCode } from "../../src/utils/errors.js";

describe("runCli", () => {
  it("prints version and exits 0", async () => {
    const writes: string[] = [];
    const exit = vi.fn();
    await runCli(["node", "aws-ec2-check", "--version"], {
      stdout: {
        write: (chunk) => {
          writes.push(chunk);
        },
      },
      stderr: { write: vi.fn() },
      exit,
    });
    expect(writes.join("")).toContain("0.1.0");
    expect(exit).toHaveBeenCalledWith(ExitCode.Success);
  });

  it("rejects invalid instance ids with usage exit code", async () => {
    const stderrChunks: string[] = [];
    const exit = vi.fn();
    await runCli(["node", "aws-ec2-check", "not-an-instance"], {
      stdout: { write: vi.fn() },
      stderr: {
        write: (chunk) => {
          stderrChunks.push(chunk);
        },
      },
      exit,
    });
    expect(stderrChunks.join("")).toContain("Invalid EC2 instance ID");
    expect(exit).toHaveBeenCalledWith(ExitCode.Usage);
  });
});
