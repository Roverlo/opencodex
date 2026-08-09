import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { ompModelsConfigPath } from "../src/clients/config-export";

describe("OMP path contract regressions", () => {
  test("PI_CONFIG_DIR remains home-relative for slash- and tilde-prefixed values", () => {
    const home = "/tmp/opencodex-omp-home";

    for (const value of ["/custom-omp", "~/.custom-omp"]) {
      expect(ompModelsConfigPath({ PI_CONFIG_DIR: value } as NodeJS.ProcessEnv, home)).toBe(
        join(home, value, "agent", "models.yml"),
      );
    }
  });

  test("a named profile ignores PI_CODING_AGENT_DIR", () => {
    const home = "/tmp/opencodex-omp-home";
    const configDir = "custom-omp";

    expect(ompModelsConfigPath({
      OMP_PROFILE: "work",
      PI_CONFIG_DIR: configDir,
      PI_CODING_AGENT_DIR: join(home, "wrong-agent"),
    } as NodeJS.ProcessEnv, home)).toBe(
      join(home, configDir, "profiles", "work", "agent", "models.yml"),
    );
  });
});
