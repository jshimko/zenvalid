/**
 * Test to verify that TypeScript correctly infers optional types for undefined defaults
 */
import { zenv } from "../core";
import {
  base64,
  base64url,
  bool,
  cuid,
  cuid2,
  datetime,
  email,
  guid,
  host,
  ipv4,
  ipv6,
  isoDate,
  isoDuration,
  isoTime,
  json,
  jwt,
  ksuid,
  nanoid,
  num,
  port,
  str,
  ulid,
  url,
  uuid,
  xid
} from "../validators";

describe("Type inference with undefined defaults", () => {
  it("should correctly type variables with undefined defaults as optional", () => {
    // Create environment with various undefined defaults
    // Use onError: "return" to avoid process.exit in tests
    const env = zenv(
      {
        // This should be typed as string | undefined
        OPTIONAL_STR: str({ default: undefined }),

        // This should be typed as string (has default)
        WITH_DEFAULT: str({ default: "hello" }),

        // Test with numbers
        OPTIONAL_NUM: num({ default: undefined }),

        // Test with booleans
        OPTIONAL_BOOL: bool({ default: undefined })
      },
      { onError: "return" }
    );

    // Runtime tests - these should all work
    expect(env.OPTIONAL_STR).toBe(undefined);
    expect(env.WITH_DEFAULT).toBe("hello");
    expect(env.OPTIONAL_NUM).toBe(undefined);
    expect(env.OPTIONAL_BOOL).toBe(undefined);
  });

  describe("Network validators with undefined defaults", () => {
    it("should handle email validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_EMAIL: email({ default: undefined }),
          EMAIL_WITH_DEFAULT: email({ default: "test@example.com" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_EMAIL).toBe(undefined);
      expect(env.EMAIL_WITH_DEFAULT).toBe("test@example.com");

      // Type assertions for compile-time verification
      const optionalEmail: string | undefined = env.OPTIONAL_EMAIL;
      const requiredEmail: string = env.EMAIL_WITH_DEFAULT;
      expect(optionalEmail).toBe(undefined);
      expect(requiredEmail).toBe("test@example.com");
    });

    it("should handle url validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_URL: url({ default: undefined }),
          URL_WITH_DEFAULT: url({ default: "https://example.com" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_URL).toBe(undefined);
      expect(env.URL_WITH_DEFAULT).toBe("https://example.com");
    });

    it("should handle host validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_HOST: host({ default: undefined }),
          HOST_WITH_DEFAULT: host({ default: "localhost" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_HOST).toBe(undefined);
      expect(env.HOST_WITH_DEFAULT).toBe("localhost");
    });

    it("should handle port validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_PORT: port({ default: undefined }),
          PORT_WITH_DEFAULT: port({ default: 3000 })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_PORT).toBe(undefined);
      expect(env.PORT_WITH_DEFAULT).toBe(3000);
    });

    it("should handle ipv4 validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_IPV4: ipv4({ default: undefined }),
          IPV4_WITH_DEFAULT: ipv4({ default: "127.0.0.1" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_IPV4).toBe(undefined);
      expect(env.IPV4_WITH_DEFAULT).toBe("127.0.0.1");
    });

    it("should handle ipv6 validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_IPV6: ipv6({ default: undefined }),
          IPV6_WITH_DEFAULT: ipv6({ default: "::1" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_IPV6).toBe(undefined);
      expect(env.IPV6_WITH_DEFAULT).toBe("::1");
    });
  });

  describe("Date/time validators with undefined defaults", () => {
    it("should handle datetime validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_DATETIME: datetime({ default: undefined }),
          DATETIME_WITH_DEFAULT: datetime({ default: "2024-01-01T00:00:00Z" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_DATETIME).toBe(undefined);
      expect(env.DATETIME_WITH_DEFAULT).toBe("2024-01-01T00:00:00Z");
    });

    it("should handle isoDate validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_DATE: isoDate({ default: undefined }),
          DATE_WITH_DEFAULT: isoDate({ default: "2024-01-01" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_DATE).toBe(undefined);
      expect(env.DATE_WITH_DEFAULT).toBe("2024-01-01");
    });

    it("should handle isoTime validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_TIME: isoTime({ default: undefined }),
          TIME_WITH_DEFAULT: isoTime({ default: "12:00:00" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_TIME).toBe(undefined);
      expect(env.TIME_WITH_DEFAULT).toBe("12:00:00");
    });

    it("should handle isoDuration validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_DURATION: isoDuration({ default: undefined }),
          DURATION_WITH_DEFAULT: isoDuration({ default: "P1D" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_DURATION).toBe(undefined);
      expect(env.DURATION_WITH_DEFAULT).toBe("P1D");
    });
  });

  describe("Encoding validators with undefined defaults", () => {
    it("should handle base64 validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_BASE64: base64({ default: undefined }),
          BASE64_WITH_DEFAULT: base64({ default: "SGVsbG8=" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_BASE64).toBe(undefined);
      expect(env.BASE64_WITH_DEFAULT).toBe("SGVsbG8=");
    });

    it("should handle base64url validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_BASE64URL: base64url({ default: undefined }),
          BASE64URL_WITH_DEFAULT: base64url({ default: "SGVsbG8" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_BASE64URL).toBe(undefined);
      expect(env.BASE64URL_WITH_DEFAULT).toBe("SGVsbG8");
    });

    it("should handle jwt validator with undefined default", () => {
      const testJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const env = zenv(
        {
          OPTIONAL_JWT: jwt({ default: undefined }),
          JWT_WITH_DEFAULT: jwt({ default: testJwt })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_JWT).toBe(undefined);
      expect(env.JWT_WITH_DEFAULT).toBe(testJwt);
    });

    it("should handle uuid validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_UUID: uuid({ default: undefined }),
          UUID_WITH_DEFAULT: uuid({ default: "123e4567-e89b-12d3-a456-426614174000" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_UUID).toBe(undefined);
      expect(env.UUID_WITH_DEFAULT).toBe("123e4567-e89b-12d3-a456-426614174000");
    });
  });

  describe("ID validators with undefined defaults", () => {
    it("should handle cuid validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_CUID: cuid({ default: undefined }),
          CUID_WITH_DEFAULT: cuid({ default: "ckopqwoua000001mk8jv2r1ss" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_CUID).toBe(undefined);
      expect(env.CUID_WITH_DEFAULT).toBe("ckopqwoua000001mk8jv2r1ss");
    });

    it("should handle cuid2 validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_CUID2: cuid2({ default: undefined }),
          CUID2_WITH_DEFAULT: cuid2({ default: "tz4a98xxat96iws9zmbrgj3a" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_CUID2).toBe(undefined);
      expect(env.CUID2_WITH_DEFAULT).toBe("tz4a98xxat96iws9zmbrgj3a");
    });

    it("should handle ulid validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_ULID: ulid({ default: undefined }),
          ULID_WITH_DEFAULT: ulid({ default: "01ARZ3NDEKTSV4RRFFQ69G5FAV" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_ULID).toBe(undefined);
      expect(env.ULID_WITH_DEFAULT).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    });

    it("should handle nanoid validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_NANOID: nanoid({ default: undefined }),
          NANOID_WITH_DEFAULT: nanoid({ default: "V1StGXR8_Z5jdHi6B-myT" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_NANOID).toBe(undefined);
      expect(env.NANOID_WITH_DEFAULT).toBe("V1StGXR8_Z5jdHi6B-myT");
    });

    it("should handle guid validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_GUID: guid({ default: undefined }),
          GUID_WITH_DEFAULT: guid({ default: "123e4567-e89b-12d3-a456-426614174000" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_GUID).toBe(undefined);
      expect(env.GUID_WITH_DEFAULT).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("should handle xid validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_XID: xid({ default: undefined }),
          XID_WITH_DEFAULT: xid({ default: "b0vl7pu23b4tmaq2hm7g" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_XID).toBe(undefined);
      expect(env.XID_WITH_DEFAULT).toBe("b0vl7pu23b4tmaq2hm7g");
    });

    it("should handle ksuid validator with undefined default", () => {
      const env = zenv(
        {
          OPTIONAL_KSUID: ksuid({ default: undefined }),
          KSUID_WITH_DEFAULT: ksuid({ default: "0ujtsYcgvSTl8PAuAdqWYSMnLOv" })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_KSUID).toBe(undefined);
      expect(env.KSUID_WITH_DEFAULT).toBe("0ujtsYcgvSTl8PAuAdqWYSMnLOv");
    });
  });

  describe("Complex validators with undefined defaults", () => {
    it("should handle json validator with undefined default", () => {
      interface Config {
        timeout: number;
        retries: number;
      }

      const env = zenv(
        {
          OPTIONAL_CONFIG: json<Config>({ default: undefined }),
          CONFIG_WITH_DEFAULT: json<Config>({ default: { timeout: 5000, retries: 3 } })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_CONFIG).toBe(undefined);
      expect(env.CONFIG_WITH_DEFAULT).toEqual({ timeout: 5000, retries: 3 });

      // Type assertions for compile-time verification
      const optionalConfig: Config | undefined = env.OPTIONAL_CONFIG;
      const requiredConfig: Config = env.CONFIG_WITH_DEFAULT;
      expect(optionalConfig).toBe(undefined);
      expect(requiredConfig).toEqual({ timeout: 5000, retries: 3 });
    });
  });

  it("should handle environment-specific undefined defaults", () => {
    process.env.PROVIDED_VAR = "actual-value";

    const env = zenv({
      // In test environment, this uses testDefault (undefined)
      TEST_SPECIFIC: str({
        default: "prod-default",
        devDefault: "dev-default",
        testDefault: undefined
      }),

      // This one has a value provided
      PROVIDED_VAR: str({
        default: undefined
      })
    });

    // In test environment, TEST_SPECIFIC should be undefined
    expect(env.TEST_SPECIFIC).toBe(undefined);

    // PROVIDED_VAR should have the actual value
    expect(env.PROVIDED_VAR).toBe("actual-value");

    delete process.env.PROVIDED_VAR;
  });

  it("should work with type assertions (compile-time type test)", () => {
    const env = zenv({
      OPTIONAL_VAR: str({ default: undefined }),
      REQUIRED_VAR: str({ default: "value" })
    });

    // These type assertions verify compile-time behavior
    // They won't fail at runtime, but TypeScript would error if types were wrong

    // OPTIONAL_VAR should accept undefined
    const optionalValue: string | undefined = env.OPTIONAL_VAR;
    expect(optionalValue).toBe(undefined);

    // REQUIRED_VAR should be string
    const requiredValue: string = env.REQUIRED_VAR;
    expect(requiredValue).toBe("value");
  });

  describe("Edge cases with undefined defaults", () => {
    it("should handle choices with undefined default", () => {
      const env = zenv(
        {
          // With undefined default, should be "a" | "b" | "c" | undefined
          OPTIONAL_CHOICE: str({
            choices: ["a", "b", "c"],
            default: undefined
          }),
          // With a valid default from choices
          CHOICE_WITH_DEFAULT: str({
            choices: ["x", "y", "z"],
            default: "y"
          })
        },
        { onError: "return" }
      );

      expect(env.OPTIONAL_CHOICE).toBe(undefined);
      expect(env.CHOICE_WITH_DEFAULT).toBe("y");

      // Type verification
      const optionalChoice: "a" | "b" | "c" | undefined = env.OPTIONAL_CHOICE;
      const requiredChoice: "x" | "y" | "z" = env.CHOICE_WITH_DEFAULT;
      expect(optionalChoice).toBe(undefined);
      expect(requiredChoice).toBe("y");
    });

    it("should handle environment-specific defaults with choices", () => {
      // We need to explicitly change NODE_ENV if we want to test the behavior
      const originalEnv = process.env;

      try {
        // Force test environment
        process.env = { NODE_ENV: "test" };

        const env = zenv(
          {
            LOG_LEVEL: str({
              choices: ["debug", "info", "warn", "error"],
              default: "error",
              devDefault: "debug",
              testDefault: undefined // Optional in test
            })
          },
          { onError: "return" }
        );

        // In test environment, should be undefined
        expect(env.LOG_LEVEL).toBe(undefined);
      } finally {
        process.env = originalEnv;
      }
    });

    it("should handle multiple undefined defaults in same config", () => {
      const env = zenv(
        {
          OPT1: str({ default: undefined }),
          OPT2: num({ default: undefined }),
          OPT3: bool({ default: undefined }),
          OPT4: json<{ key: string }>({ default: undefined }),
          REQ1: str({ default: "required" }),
          REQ2: num({ default: 42 })
        },
        { onError: "return" }
      );

      // All optional should be undefined
      expect(env.OPT1).toBe(undefined);
      expect(env.OPT2).toBe(undefined);
      expect(env.OPT3).toBe(undefined);
      expect(env.OPT4).toBe(undefined);

      // Required should have their defaults
      expect(env.REQ1).toBe("required");
      expect(env.REQ2).toBe(42);
    });

    it("should handle nested json with undefined default", () => {
      interface ComplexConfig {
        database: {
          host: string;
          port: number;
          credentials?: {
            user: string;
            password: string;
          };
        };
        features: string[];
      }

      const env = zenv(
        {
          COMPLEX_OPTIONAL: json<ComplexConfig>({ default: undefined }),
          COMPLEX_WITH_DEFAULT: json<ComplexConfig>({
            default: {
              database: {
                host: "localhost",
                port: 5432
              },
              features: ["feature1", "feature2"]
            }
          })
        },
        { onError: "return" }
      );

      expect(env.COMPLEX_OPTIONAL).toBe(undefined);
      expect(env.COMPLEX_WITH_DEFAULT).toEqual({
        database: {
          host: "localhost",
          port: 5432
        },
        features: ["feature1", "feature2"]
      });
    });

    it("should handle mixed environment defaults", () => {
      const originalEnv = process.env;

      try {
        // Test development environment
        process.env = { NODE_ENV: "development" };
        const devEnv = zenv(
          {
            ALWAYS_OPTIONAL: str({ default: undefined }),
            DEBUG_MODE: bool({
              default: false,
              devDefault: true,
              testDefault: false
            }),
            API_KEY: str({
              devDefault: undefined,
              testDefault: undefined
            })
          },
          { onError: "return" }
        );
        expect(devEnv.ALWAYS_OPTIONAL).toBe(undefined);
        expect(devEnv.DEBUG_MODE).toBe(true);
        expect(devEnv.API_KEY).toBe(undefined);

        // Test test environment
        process.env = { NODE_ENV: "test" };
        const testEnv = zenv(
          {
            ALWAYS_OPTIONAL: str({ default: undefined }),
            DEBUG_MODE: bool({
              default: false,
              devDefault: true,
              testDefault: false
            }),
            API_KEY: str({
              devDefault: undefined,
              testDefault: undefined
            })
          },
          { onError: "return" }
        );
        expect(testEnv.ALWAYS_OPTIONAL).toBe(undefined);
        expect(testEnv.DEBUG_MODE).toBe(false);
        expect(testEnv.API_KEY).toBe(undefined);

        // Test production environment - API_KEY should be required
        process.env = { NODE_ENV: "production" };
        expect(() => {
          zenv(
            {
              API_KEY: str({
                devDefault: undefined,
                testDefault: undefined
              })
            },
            { onError: "throw" }
          );
        }).toThrow("Environment validation failed");

        // Production with all required values provided
        process.env = { NODE_ENV: "production", API_KEY: "prod-key" };
        const prodEnv = zenv(
          {
            ALWAYS_OPTIONAL: str({ default: undefined }),
            DEBUG_MODE: bool({
              default: false,
              devDefault: true,
              testDefault: false
            }),
            API_KEY: str({
              devDefault: undefined,
              testDefault: undefined
            })
          },
          { onError: "return" }
        );
        expect(prodEnv.ALWAYS_OPTIONAL).toBe(undefined);
        expect(prodEnv.DEBUG_MODE).toBe(false);
        expect(prodEnv.API_KEY).toBe("prod-key");
      } finally {
        process.env = originalEnv;
      }
    });
  });
});
