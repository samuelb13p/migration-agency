import { describe, expect, it } from "vitest";
import { registerSchema } from "@migration-agency/shared";

describe("authentication validation", () => {
  it("accepts a strong registration payload", () => {
    expect(
      registerSchema.parse({
        email: "customer@example.com",
        password: "StrongPass123",
        firstName: "Demo",
        lastName: "Customer",
      }).email,
    ).toBe("customer@example.com");
  });

  it("rejects a weak password", () => {
    expect(() =>
      registerSchema.parse({
        email: "customer@example.com",
        password: "weak",
        firstName: "Demo",
        lastName: "Customer",
      }),
    ).toThrow();
  });
});
