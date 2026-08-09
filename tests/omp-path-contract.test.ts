import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ompModelsConfigPath } from "../src/clients/config-export";

describe("OMP path contract", () => {
  test("keeps PI_CONFIG_DIR home-relative for slash and tilde prefixes", () => {
    const home = mkdtempSync(join(tmpdir(), "ocx-omp-path-contract-"));
    try {
      expect(ompModelsConfigPath({ PI_CONFIG_DIR: "/custom-omp" } as NodeJS.ProcessEnv, home)).toBe(
        join(home, "/custom-omp", "agent", "models.yml"),
      );
      expect(ompModelsConfigPath({ PI_CONFIG_DIR: "~/.custom-omp" } as NodeJS.ProcessEnv, home)).toBe(
        join(home, "~/.custom-omp", "agent", "models.yml"),
      );
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  test("ignores PI_CODING_AGENT_DIR when an OMP profile is active", () => {
    const home = mkdtempSync(join(tmpdir(), "ocx-omp-profile-contract-"));
    try {
      expect(ompModelsConfigPath({
        OMP_PROFILE: "work",
        PI_CONFIG_DIR: "custom-omp",
        PI_CODING_AGENT_DIR: join(home, "wrong-agent"),
      } as NodeJS.ProcessEnv, home)).toBe(
        join(home, "custom-omp", "profiles", "work", "agent", "models.yml"),
      );
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});
