import { bool, num, str, zenv } from "../index";

describe("Environment-specific optionality with undefined defaults", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("devDefault with undefined", () => {
    it("should make variable optional in development when devDefault is undefined", () => {
      process.env = { NODE_ENV: "development" };

      const env = zenv({
        OPTIONAL_VAR: str({
          devDefault: undefined,
          description: "Optional in dev with undefined default"
        })
      });

      expect(env.OPTIONAL_VAR).toBe(undefined);
      expect("OPTIONAL_VAR" in env).toBe(true);
    });

    it("should require variable in production when only devDefault is set to undefined", () => {
      process.env = { NODE_ENV: "production" };

      expect(() => {
        zenv(
          {
            REQUIRED_VAR: str({
              devDefault: undefined,
              description: "Required in production"
            })
          },
          { onError: "throw" }
        );
      }).toThrow("Environment validation failed");
    });

    it("should use actual value when provided even if devDefault is undefined", () => {
      process.env = {
        NODE_ENV: "development",
        PROVIDED_VAR: "actual-value"
      };

      const env = zenv({
        PROVIDED_VAR: str({
          devDefault: undefined
        })
      });

      expect(env.PROVIDED_VAR).toBe("actual-value");
    });
  });

  describe("testDefault with undefined", () => {
    it("should make variable optional in test when testDefault is undefined", () => {
      process.env = { NODE_ENV: "test" };

      const env = zenv({
        TEST_OPTIONAL: str({
          testDefault: undefined,
          description: "Optional in test with undefined default"
        })
      });

      expect(env.TEST_OPTIONAL).toBe(undefined);
      expect("TEST_OPTIONAL" in env).toBe(true);
    });

    it("should require variable in other environments", () => {
      process.env = { NODE_ENV: "production" };

      expect(() => {
        zenv(
          {
            TEST_OPTIONAL: str({
              testDefault: undefined
            })
          },
          { onError: "throw" }
        );
      }).toThrow("Environment validation failed");
    });
  });

  describe("default with undefined", () => {
    it("should make variable optional in all environments when default is undefined", () => {
      const environments = ["development", "test", "production"];

      environments.forEach((nodeEnv) => {
        process.env = { NODE_ENV: nodeEnv };

        const env = zenv({
          ALWAYS_OPTIONAL: str({
            default: undefined,
            description: "Optional everywhere"
          })
        });

        expect(env.ALWAYS_OPTIONAL).toBe(undefined);
        expect("ALWAYS_OPTIONAL" in env).toBe(true);
      });
    });
  });

  describe("Complex scenarios", () => {
    it("should handle STRIPE_API_KEY pattern (required in prod, optional in dev/test)", () => {
      // Development - should be optional
      process.env = { NODE_ENV: "development" };
      const devEnv = zenv({
        STRIPE_API_KEY: str({
          devDefault: undefined,
          testDefault: undefined
        })
      });
      expect(devEnv.STRIPE_API_KEY).toBe(undefined);

      // Test - should be optional
      process.env = { NODE_ENV: "test" };
      const testEnv = zenv({
        STRIPE_API_KEY: str({
          devDefault: undefined,
          testDefault: undefined
        })
      });
      expect(testEnv.STRIPE_API_KEY).toBe(undefined);

      // Production - should be required
      process.env = { NODE_ENV: "production" };
      expect(() => {
        zenv(
          {
            STRIPE_API_KEY: str({
              devDefault: undefined,
              testDefault: undefined
            })
          },
          { onError: "throw" }
        );
      }).toThrow("Environment validation failed");

      // Production with value - should work
      process.env = {
        NODE_ENV: "production",
        STRIPE_API_KEY: "sk_live_123"
      };
      const prodEnv = zenv({
        STRIPE_API_KEY: str({
          devDefault: undefined,
          testDefault: undefined
        })
      });
      expect(prodEnv.STRIPE_API_KEY).toBe("sk_live_123");
    });

    it("should handle DATABASE_REPLICA_URL pattern (required in prod, uses main DB in dev, undefined in test)", () => {
      // Test - should be undefined
      process.env = { NODE_ENV: "test" };
      const testEnv = zenv({
        DATABASE_REPLICA_URL: str({
          testDefault: undefined
        })
      });
      expect(testEnv.DATABASE_REPLICA_URL).toBe(undefined);

      // Development - should use DATABASE_URL value
      process.env = {
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://localhost:5432/dev"
      };
      const devEnv = zenv({
        DATABASE_REPLICA_URL: str({
          devDefault: process.env.DATABASE_URL,
          testDefault: undefined
        })
      });
      expect(devEnv.DATABASE_REPLICA_URL).toBe("postgresql://localhost:5432/dev");

      // Production - should be required
      process.env = { NODE_ENV: "production" };
      expect(() => {
        zenv(
          {
            DATABASE_REPLICA_URL: str({
              devDefault: "fallback-value",
              testDefault: undefined
            })
          },
          { onError: "throw" }
        );
      }).toThrow("Environment validation failed");
    });

    it("should handle FEATURE_FLAG pattern (optional everywhere)", () => {
      const environments = ["development", "test", "production"];

      environments.forEach((nodeEnv) => {
        process.env = { NODE_ENV: nodeEnv };

        const env = zenv({
          FEATURE_FLAG: str({
            default: undefined,
            devDefault: undefined,
            testDefault: undefined
          })
        });

        expect(env.FEATURE_FLAG).toBe(undefined);
      });
    });
  });

  describe("Type safety with undefined defaults", () => {
    it("should maintain proper types with undefined defaults", () => {
      process.env = { NODE_ENV: "development" };

      const env = zenv({
        STRING_VAR: str({ devDefault: undefined }),
        NUMBER_VAR: num({ devDefault: undefined }),
        BOOL_VAR: bool({ devDefault: undefined })
      });

      // Type checks (these would fail TypeScript compilation if types were wrong)
      const s: string | undefined = env.STRING_VAR;
      const n: number | undefined = env.NUMBER_VAR;
      const b: boolean | undefined = env.BOOL_VAR;

      expect(s).toBe(undefined);
      expect(n).toBe(undefined);
      expect(b).toBe(undefined);
    });
  });

  describe("Protective proxy with undefined values", () => {
    it("should handle undefined values through the protective proxy", () => {
      process.env = { NODE_ENV: "development" };

      const env = zenv({
        UNDEFINED_VAR: str({ devDefault: undefined })
      });

      // Should be able to access the property
      expect("UNDEFINED_VAR" in env).toBe(true);

      // Should return undefined
      expect(env.UNDEFINED_VAR).toBe(undefined);

      // Should not throw when accessing
      expect(() => env.UNDEFINED_VAR).not.toThrow();
    });
  });
});
