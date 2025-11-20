/**
 * @module core-immutability.test
 * @description Tests for core.ts immutability, validation errors, and edge cases
 */
import { z } from "zod/v4";

import { zenv } from "../core";
import { ZenvError } from "../errors";
import { num, str } from "../validators";
import { mockProcessEnv, suppressConsole } from "./test-utils";

describe("core immutability and protection", () => {
  it("should prevent mutation of environment variables", () => {
    const env = mockProcessEnv({
      API_URL: "https://api.example.com"
    });

    const result = zenv({
      API_URL: str()
    });

    // Attempt to mutate - should throw TypeError
    expect(() => {
      result.API_URL = "https://new-api.example.com";
    }).toThrow(TypeError);

    expect(() => {
      result.API_URL = "https://new-api.example.com";
    }).toThrow("[zenv] Attempt to mutate environment value: API_URL");

    // Try mutating with different property
    expect(() => {
      // @ts-expect-error Testing runtime mutation prevention
      result.NEW_VAR = "value";
    }).toThrow("[zenv] Attempt to mutate environment value: NEW_VAR");

    env.restore();
  });

  it("should reject non-Zod validators", () => {
    const env = mockProcessEnv({
      PORT: "3000"
    });
    const { restore: suppressRestore } = suppressConsole();

    // Try with string instead of Zod schema
    try {
      zenv(
        {
          // @ts-expect-error Testing runtime type check
          PORT: "not a schema"
        },
        {
          onError: "throw"
        }
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(ZenvError);
      if (error instanceof ZenvError) {
        expect(error.message).toBe("Environment validation failed");
        expect(error.zodErrors?.[0]?.issues[0]?.message).toContain('Invalid validator for "PORT": must be a Zod schema');
      }
    }

    // Try with number
    try {
      zenv(
        {
          // @ts-expect-error Testing runtime type check
          PORT: 123
        },
        {
          onError: "throw"
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ZenvError);
      if (error instanceof ZenvError) {
        expect(error.zodErrors?.[0]?.issues[0]?.message).toContain('Invalid validator for "PORT": must be a Zod schema');
      }
    }

    // Try with plain object
    try {
      zenv(
        {
          // @ts-expect-error Testing runtime type check
          PORT: { type: "number" }
        },
        {
          onError: "throw"
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ZenvError);
      if (error instanceof ZenvError) {
        expect(error.zodErrors?.[0]?.issues[0]?.message).toContain('Invalid validator for "PORT": must be a Zod schema');
      }
    }

    // Try with function that returns non-Zod
    try {
      zenv(
        {
          // @ts-expect-error Testing runtime type check
          PORT: ((): unknown => "not a schema")()
        },
        {
          onError: "throw"
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ZenvError);
      if (error instanceof ZenvError) {
        expect(error.zodErrors?.[0]?.issues[0]?.message).toContain('Invalid validator for "PORT": must be a Zod schema');
      }
    }

    suppressRestore();
    env.restore();
  });

  it("should properly categorize missing required variables in error messages", () => {
    const env = mockProcessEnv({
      // Intentionally not setting required variables
    });

    const { restore: suppressRestore } = suppressConsole();

    try {
      zenv(
        {
          API_KEY: str(), // Required, no default
          DATABASE_URL: str(), // Required, no default
          PORT: num() // Required, no default
        },
        {
          onError: "throw"
        }
      );
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ZenvError);

      if (error instanceof ZenvError) {
        // The error message is generic, detailed info is in zodErrors
        expect(error.message).toBe("Environment validation failed");
        expect(error.zodErrors).toBeDefined();
        expect(error.zodErrors?.length).toBeGreaterThan(0);
      }
    }

    suppressRestore();
    env.restore();
  });

  it("should return partial results with metadata when onError is 'return'", (): void => {
    const env = mockProcessEnv({
      VALID_VAR: "valid"
      // Missing REQUIRED_VAR
    });

    const { restore: suppressRestore } = suppressConsole();

    const result = zenv(
      {
        VALID_VAR: str(),
        REQUIRED_VAR: str() // This will fail validation
      },
      {
        onError: "return",
        clientSafePrefixes: ["NEXT_PUBLIC_", "VITE_"]
      }
    );

    // Check that valid variables are still accessible
    expect(result.VALID_VAR).toBe("valid");

    // Check that __clientSafePrefixes__ property exists but is not enumerable
    // This tests line 435 in core.ts
    expect(result.__clientSafePrefixes__).toEqual(["NEXT_PUBLIC_", "VITE_"]);
    expect(Object.keys(result)).not.toContain("__clientSafePrefixes__");

    // Verify property descriptor
    const descriptor = Object.getOwnPropertyDescriptor(result, "__clientSafePrefixes__");
    expect(descriptor).toBeDefined();
    expect(descriptor?.enumerable).toBe(false);
    expect(descriptor?.writable).toBe(false);
    expect(descriptor?.configurable).toBe(false);

    suppressRestore();
    env.restore();
  });

  it("should handle ZenvError properly with missing variables", (): void => {
    const env = mockProcessEnv({});
    const { restore: suppressRestore } = suppressConsole();

    try {
      zenv(
        {
          MISSING_VAR: str()
        },
        {
          onError: "throw"
        }
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(ZenvError);
      if (error instanceof ZenvError) {
        expect(error.message).toBe("Environment validation failed");
      }
    }

    suppressRestore();
    env.restore();
  });

  it("should handle ZenvError properly with invalid variables", (): void => {
    const env = mockProcessEnv({
      PORT: "not-a-number"
    });
    const { restore: suppressRestore } = suppressConsole();

    try {
      zenv(
        {
          PORT: num()
        },
        {
          onError: "throw"
        }
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(ZenvError);
      if (error instanceof ZenvError) {
        expect(error.message).toBe("Environment validation failed");
      }
    }

    suppressRestore();
    env.restore();
  });

  it("should handle missing variables with custom Zod schemas", (): void => {
    const env = mockProcessEnv({});
    const { restore: suppressRestore } = suppressConsole();

    const customSchema = z.string().min(10).describe("Custom API key");

    try {
      zenv(
        {
          CUSTOM_API_KEY: customSchema
        },
        {
          onError: "throw"
        }
      );
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ZenvError);
      if (error instanceof ZenvError) {
        expect(error.message).toBe("Environment validation failed");
      }
    }

    suppressRestore();
    env.restore();
  });
});
