import { redactSensitive } from "../src/common/utils/redact-sensitive";

describe("redactSensitive (logging / error bodies)", () => {
  it("replaces cpf-like keys in plain objects", () => {
    expect(redactSensitive({ cpf: "52998224725" })).toEqual({
      cpf: "[REDACTED]",
    });
  });

  it("redacts nested values", () => {
    expect(
      redactSensitive({
        user: { cpfNormalized: "123", name: "x" },
      }),
    ).toEqual({
      user: { cpfNormalized: "[REDACTED]", name: "x" },
    });
  });
});
