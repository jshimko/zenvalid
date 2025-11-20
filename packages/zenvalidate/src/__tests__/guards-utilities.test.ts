/**
 * @module guards-utilities.test
 * @description Tests for type guards and utility functions in guards.ts
 */
import { ZodError } from "zod/v4";

import { ensureString, getErrorMessage, hasBaseOptions, isClientConfig, isError, isZodError } from "../types/guards";

describe("hasBaseOptions validation", () => {
  it("should validate correct BaseOptions objects", () => {
    // This tests lines 188-209 in guards.ts
    expect(hasBaseOptions({})).toBe(true); // Empty is valid

    expect(
      hasBaseOptions({
        options: {
          default: "value"
        }
      })
    ).toBe(true);

    expect(
      hasBaseOptions({
        options: {
          default: "value",
          devDefault: "dev",
          testDefault: "test",
          description: "A description",
          example: "example"
        }
      })
    ).toBe(true);

    expect(
      hasBaseOptions({
        options: {
          client: {
            expose: true,
            transform: (x: unknown) => x,
            default: "client-default"
          }
        }
      })
    ).toBe(true);
  });

  it("should reject objects with invalid keys", () => {
    // Unknown properties should fail validation
    expect(
      hasBaseOptions({
        options: {
          default: "value",
          unknownKey: "should fail"
        }
      })
    ).toBe(false);

    expect(
      hasBaseOptions({
        invalidProp: 123
      })
    ).toBe(false);

    expect(
      hasBaseOptions({
        options: {
          default: "value",
          extra: "not allowed",
          another: "also not allowed"
        }
      })
    ).toBe(false);
  });

  it("should validate client config when present", () => {
    // Valid client config
    expect(
      hasBaseOptions({
        options: {
          client: {
            expose: true
          }
        }
      })
    ).toBe(true);

    expect(
      hasBaseOptions({
        options: {
          client: {
            expose: false,
            transform: (x: string) => x.toUpperCase(),
            default: "default",
            devDefault: "dev"
          }
        }
      })
    ).toBe(true);

    // Invalid client config should fail
    expect(
      hasBaseOptions({
        options: {
          client: "not an object"
        }
      })
    ).toBe(false);

    expect(
      hasBaseOptions({
        options: {
          client: {
            expose: "not a boolean" // Wrong type
          }
        }
      })
    ).toBe(false);

    expect(
      hasBaseOptions({
        options: {
          client: {
            unknownProp: "invalid"
          }
        }
      })
    ).toBe(false);

    expect(
      hasBaseOptions({
        options: {
          client: null
        }
      })
    ).toBe(false);
  });

  it("should handle all valid BaseOptions properties", () => {
    const fullOptions = {
      options: {
        default: "default-value",
        devDefault: "dev-value",
        testDefault: "test-value",
        description: "This is a description",
        example: "example-value",
        client: {
          expose: true,
          transform: (x: string): string => x,
          default: "client-default",
          devDefault: "client-dev"
        }
      }
    };

    expect(hasBaseOptions(fullOptions)).toBe(true);
  });
});

describe("ensureString utility", () => {
  it("should stringify objects and arrays using JSON.stringify", () => {
    // This tests line 342 in guards.ts
    expect(ensureString({ key: "value" })).toBe('{"key":"value"}');
    expect(ensureString({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
    expect(ensureString([1, 2, 3])).toBe("[1,2,3]");
    expect(ensureString([])).toBe("[]");
    expect(ensureString({})).toBe("{}");

    // Complex nested objects
    expect(
      ensureString({
        nested: {
          array: [1, 2],
          obj: { x: "y" }
        }
      })
    ).toBe('{"nested":{"array":[1,2],"obj":{"x":"y"}}}');
  });

  it("should handle primitive values", () => {
    expect(ensureString("already a string")).toBe("already a string");
    expect(ensureString(123)).toBe("123");
    expect(ensureString(true)).toBe("true");
    expect(ensureString(false)).toBe("false");
    expect(() => ensureString(null)).toThrow("Cannot convert null or undefined to string");
    expect(() => ensureString(undefined)).toThrow("Cannot convert null or undefined to string");
  });

  it("should handle special number values", () => {
    expect(ensureString(NaN)).toBe("NaN");
    expect(ensureString(Infinity)).toBe("null"); // JSON.stringify converts Infinity to null
    expect(ensureString(-Infinity)).toBe("null");
  });

  it("should handle circular references gracefully", () => {
    interface CircularRef {
      a: number;
      self?: CircularRef;
    }
    const circular: CircularRef = { a: 1 };
    circular.self = circular;

    // JSON.stringify throws on circular references
    expect(() => ensureString(circular)).toThrow();
  });
});

describe("getErrorMessage utility", () => {
  it("should extract messages from ZodError", () => {
    // This tests line 489 in guards.ts
    const zodError = new ZodError([
      {
        path: ["field1"],
        message: "Field1 is required",
        code: "custom"
      },
      {
        path: ["field2"],
        message: "Field2 must be a number",
        code: "custom"
      }
    ]);

    const message = getErrorMessage(zodError);
    expect(message).toBe("Field1 is required, Field2 must be a number");
  });

  it("should handle single issue ZodError", () => {
    const zodError = new ZodError([
      {
        path: ["email"],
        message: "Invalid email format",
        code: "custom"
      }
    ]);

    expect(getErrorMessage(zodError)).toBe("Invalid email format");
  });

  it("should handle Error instances", () => {
    const error = new Error("Something went wrong");
    expect(getErrorMessage(error)).toBe("Something went wrong");

    const typeError = new TypeError("Type mismatch");
    expect(getErrorMessage(typeError)).toBe("Type mismatch");
  });

  it("should handle string errors", () => {
    expect(getErrorMessage("String error message")).toBe("String error message");
    expect(getErrorMessage("")).toBe("");
  });

  it("should return 'Unknown error' for unknown types", () => {
    // This tests line 497 in guards.ts
    expect(getErrorMessage({ custom: "error" })).toBe("Unknown error");
    expect(getErrorMessage([1, 2, 3])).toBe("Unknown error");
    expect(getErrorMessage(Symbol("error"))).toBe("Unknown error");
    expect(getErrorMessage(() => "function")).toBe("Unknown error");

    // Non-Error objects
    class CustomClass {
      toString(): string {
        return "custom";
      }
    }
    expect(getErrorMessage(new CustomClass())).toBe("Unknown error");
  });

  it("should handle null and undefined", () => {
    expect(getErrorMessage(null)).toBe("null");
    expect(getErrorMessage(undefined)).toBe("undefined");
  });

  it("should handle numeric error codes", () => {
    expect(getErrorMessage(404)).toBe("404");
    expect(getErrorMessage(0)).toBe("0");
    expect(getErrorMessage(-1)).toBe("-1");
  });

  it("should handle boolean values", () => {
    expect(getErrorMessage(true)).toBe("true");
    expect(getErrorMessage(false)).toBe("false");
  });
});

describe("isClientConfig type guard", () => {
  it("should validate valid ClientConfig objects", () => {
    expect(isClientConfig({ expose: true })).toBe(true);
    expect(isClientConfig({ expose: false })).toBe(true);

    expect(
      isClientConfig({
        expose: true,
        transform: (x: unknown) => x
      })
    ).toBe(true);

    expect(
      isClientConfig({
        expose: true,
        transform: (x: string) => x.toUpperCase(),
        default: "default",
        devDefault: "dev-default"
      })
    ).toBe(true);
  });

  it("should reject invalid ClientConfig", () => {
    expect(isClientConfig(null)).toBe(false);
    expect(isClientConfig(undefined)).toBe(false);
    expect(isClientConfig("string")).toBe(false);
    expect(isClientConfig(123)).toBe(false);
    expect(isClientConfig([])).toBe(false);

    // Missing expose or wrong type
    expect(isClientConfig({})).toBe(false);
    expect(isClientConfig({ expose: "yes" })).toBe(false);
    expect(isClientConfig({ expose: 1 })).toBe(false);

    // Invalid properties
    expect(
      isClientConfig({
        expose: true,
        invalidProp: "not allowed"
      })
    ).toBe(false);

    // Wrong transform type
    expect(
      isClientConfig({
        expose: true,
        transform: "not a function"
      })
    ).toBe(false);
  });
});

describe("isError type guard", () => {
  it("should identify Error instances", () => {
    expect(isError(new Error("test"))).toBe(true);
    expect(isError(new TypeError("type error"))).toBe(true);
    expect(isError(new RangeError("range error"))).toBe(true);
    expect(isError(new SyntaxError("syntax error"))).toBe(true);
  });

  it("should reject non-Error values", () => {
    expect(isError("error string")).toBe(false);
    expect(isError({ message: "error" })).toBe(false);
    expect(isError(null)).toBe(false);
    expect(isError(undefined)).toBe(false);
    expect(isError(123)).toBe(false);
  });
});

describe("isZodError type guard", () => {
  it("should identify ZodError instances", () => {
    const zodError = new ZodError([{ path: [], message: "test", code: "custom" }]);
    expect(isZodError(zodError)).toBe(true);
  });

  it("should reject non-ZodError values", () => {
    expect(isZodError(new Error("regular error"))).toBe(false);
    expect(isZodError("error")).toBe(false);
    expect(isZodError({ issues: [] })).toBe(false);
    expect(isZodError(null)).toBe(false);
  });
});
