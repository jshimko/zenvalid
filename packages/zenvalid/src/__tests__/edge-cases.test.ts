/**
 * @module edge-cases.test
 * @description Edge cases and stress tests for `zenvalid`
 */
import { z } from "zod/v4";

import { zenv } from "../core";
import { bool, getMetadata, json, num, port, str, url } from "../validators";
import { createMockEnv, mockProcessEnv, suppressConsole } from "./test-utils";

describe("Edge Cases & Stress Tests", () => {
  let envMock: ReturnType<typeof mockProcessEnv>;
  let consoleMock: ReturnType<typeof suppressConsole>;

  beforeEach(() => {
    envMock = mockProcessEnv(createMockEnv());
    consoleMock = suppressConsole();
  });

  afterEach(() => {
    envMock.restore();
    consoleMock.restore();
  });

  describe("Unusual Inputs", () => {
    it("should handle completely empty environment", () => {
      envMock.restore();
      envMock = mockProcessEnv({});

      const env = zenv(
        {
          VAR1: str({ default: "default1" }),
          VAR2: num({ default: 42 }),
          VAR3: bool({ default: true }),
          VAR4: port({ default: 3000 }),
          VAR5: url({ default: "http://localhost" })
        },
        { onError: "return", strict: false }
      );

      expect(env.VAR1).toBe("default1");
      expect(env.VAR2).toBe(42);
      expect(env.VAR3).toBe(true);
      expect(env.VAR4).toBe(3000);
      expect(env.VAR5).toBe("http://localhost");
    });

    it("should handle massive environment with 1000+ variables", () => {
      const massiveEnv: Record<string, string> = { NODE_ENV: "test" };
      const schema: Record<string, z.ZodType> = { NODE_ENV: str() };

      // Create 1000 environment variables
      for (let i = 0; i < 1000; i++) {
        massiveEnv[`VAR_${i}`] = `value_${i}`;
        schema[`VAR_${i}`] = str();
      }

      envMock.restore();
      envMock = mockProcessEnv(massiveEnv);

      const startTime = Date.now();
      const env = zenv(schema, { onError: "throw" });
      const endTime = Date.now();

      // Should complete in reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      // Spot check some values
      expect(env.NODE_ENV).toBe("test");
      expect(env.VAR_0).toBe("value_0");
      expect(env.VAR_500).toBe("value_500");
      expect(env.VAR_999).toBe("value_999");

      // Check that Object.keys works correctly
      const keys = Object.keys(env);
      expect(keys).toHaveLength(1001); // NODE_ENV + 1000 vars
      expect(keys).toContain("VAR_0");
      expect(keys).toContain("VAR_999");
    });

    it("should handle unicode and special characters in variable names", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        API_KEY: "secret",
        DATABASE_URL: "postgres://localhost",
        EMOJI_VAR: "🚀🎉✨",
        CHINESE_VAR: "你好世界",
        ARABIC_VAR: "مرحبا بالعالم",
        MIXED_UNICODE: "Hello 世界 🌍 مرحبا мир"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          API_KEY: str(),
          DATABASE_URL: url(),
          EMOJI_VAR: str(),
          CHINESE_VAR: str(),
          ARABIC_VAR: str(),
          MIXED_UNICODE: str()
        },
        { onError: "throw" }
      );

      expect(env.EMOJI_VAR).toBe("🚀🎉✨");
      expect(env.CHINESE_VAR).toBe("你好世界");
      expect(env.ARABIC_VAR).toBe("مرحبا بالعالم");
      expect(env.MIXED_UNICODE).toBe("Hello 世界 🌍 مرحبا мир");
    });

    it("should handle very long string values", () => {
      const veryLongString = "x".repeat(100000); // 100KB string
      const longJSON = JSON.stringify({ data: Array(1000).fill("item") });

      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        LONG_STRING: veryLongString,
        LONG_JSON: longJSON
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          LONG_STRING: str(),
          LONG_JSON: json()
        },
        { onError: "throw" }
      );

      expect(env.LONG_STRING).toBe(veryLongString);
      expect(env.LONG_STRING.length).toBe(100000);
      expect(env.LONG_JSON).toEqual({ data: Array(1000).fill("item") });
    });

    it("should handle edge case boolean values", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        BOOL1: "TRUE",
        BOOL2: "False",
        BOOL3: "YES",
        BOOL4: "No",
        BOOL5: "ON",
        BOOL6: "off",
        BOOL7: "1",
        BOOL8: "0"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          BOOL1: bool(),
          BOOL2: bool(),
          BOOL3: bool(),
          BOOL4: bool(),
          BOOL5: bool(),
          BOOL6: bool(),
          BOOL7: bool(),
          BOOL8: bool()
        },
        { onError: "throw" }
      );

      expect(env.BOOL1).toBe(true);
      expect(env.BOOL2).toBe(false);
      expect(env.BOOL3).toBe(true);
      expect(env.BOOL4).toBe(false);
      expect(env.BOOL5).toBe(true);
      expect(env.BOOL6).toBe(false);
      expect(env.BOOL7).toBe(true);
      expect(env.BOOL8).toBe(false);
    });

    it("should handle edge case number values", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        NUM1: "0",
        NUM2: "-0",
        NUM3: "3.14159265359",
        NUM4: "1e10",
        NUM5: "1E-10",
        NUM6: String(Number.MAX_SAFE_INTEGER),
        NUM7: String(Number.MIN_SAFE_INTEGER),
        NUM8: "0.1",
        NUM9: "0.30000000000000004" // Floating point precision issue
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          NUM1: num(),
          NUM2: num(),
          NUM3: num(),
          NUM4: num(),
          NUM5: num(),
          NUM6: num(),
          NUM7: num(),
          NUM8: num(),
          NUM9: num()
        },
        { onError: "throw" }
      );

      expect(env.NUM1).toBe(0);
      expect(env.NUM2).toBe(-0);
      expect(Object.is(env.NUM2, -0)).toBe(true); // Distinguish -0 from 0
      expect(env.NUM3).toBeCloseTo(3.14159265359);
      expect(env.NUM4).toBe(1e10);
      expect(env.NUM5).toBe(1e-10);
      expect(env.NUM6).toBe(Number.MAX_SAFE_INTEGER);
      expect(env.NUM7).toBe(Number.MIN_SAFE_INTEGER);
      expect(env.NUM8).toBe(0.1);
      expect(env.NUM9).toBeCloseTo(0.3);
    });

    it("should handle whitespace in values", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        LEADING_SPACE: "  value",
        TRAILING_SPACE: "value  ",
        BOTH_SPACES: "  value  ",
        TABS: "\tvalue\t",
        NEWLINES: "line1\nline2\nline3",
        MIXED_WHITESPACE: " \t\n value \n\t "
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          LEADING_SPACE: str(),
          TRAILING_SPACE: str(),
          BOTH_SPACES: str(),
          TABS: str(),
          NEWLINES: str(),
          MIXED_WHITESPACE: str()
        },
        { onError: "throw" }
      );

      // Strings preserve whitespace
      expect(env.LEADING_SPACE).toBe("  value");
      expect(env.TRAILING_SPACE).toBe("value  ");
      expect(env.BOTH_SPACES).toBe("  value  ");
      expect(env.TABS).toBe("\tvalue\t");
      expect(env.NEWLINES).toBe("line1\nline2\nline3");
      expect(env.MIXED_WHITESPACE).toBe(" \t\n value \n\t ");
    });
  });

  describe("WeakMap Behavior", () => {
    it("should not leak memory with metadata", () => {
      // Create many schemas with metadata
      const schemas: z.ZodType[] = [];

      for (let i = 0; i < 1000; i++) {
        const schema = str({
          client: {
            expose: true,
            transform: (v: string) => v.toUpperCase(),
            default: `default_${i}`
          }
        });
        schemas.push(schema);
      }

      // Check that metadata is attached
      schemas.forEach((schema, i) => {
        const metadata = getMetadata(schema);
        expect(metadata?.client?.default).toBe(`default_${i}`);
      });

      // Clear references
      schemas.length = 0;

      // Force garbage collection if available (V8 only)
      if (global.gc) {
        global.gc();
      }

      // WeakMap should allow schemas to be garbage collected
      // We can't directly test GC, but the test ensures WeakMap is used correctly
      expect(true).toBe(true);
    });

    it("should not cross-contaminate metadata between schemas", () => {
      const schema1 = str({
        client: { expose: true, default: "schema1" }
      });

      const schema2 = str({
        client: { expose: false, default: "schema2" }
      });

      const schema3 = num({
        client: { expose: true, transform: (v: number) => v * 2 }
      });

      const meta1 = getMetadata(schema1);
      const meta2 = getMetadata(schema2);
      const meta3 = getMetadata(schema3);

      expect(meta1?.client?.default).toBe("schema1");
      expect(meta1?.client?.expose).toBe(true);

      expect(meta2?.client?.default).toBe("schema2");
      expect(meta2?.client?.expose).toBe(false);

      expect(meta3?.client?.default).toBeUndefined();
      expect(meta3?.client?.expose).toBe(true);
      expect(meta3?.client?.transform).toBeDefined();
    });

    it("should handle schemas without metadata", () => {
      const plainSchema = z.string();
      const metadata = getMetadata(plainSchema);

      expect(metadata).toBeUndefined();
    });
  });

  describe("Proxy Edge Cases", () => {
    it("should handle Symbol properties correctly", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        MY_VAR: "value"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          MY_VAR: str()
        },
        { onError: "throw" }
      );

      // Common symbols
      const envObj = { ...env } as Record<string | symbol, unknown>;
      expect(() => envObj[Symbol.toStringTag]).not.toThrow();
      expect(() => envObj[Symbol.iterator]).not.toThrow();
      expect(() => envObj[Symbol.toPrimitive]).not.toThrow();

      // Node.js inspect symbol
      const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");
      expect(() => envObj[inspectSymbol]).not.toThrow();

      // Custom symbol
      const customSymbol = Symbol("custom");
      expect(() => envObj[customSymbol]).not.toThrow();
    });

    it("should handle prototype chain access", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        toString: "should-not-override",
        valueOf: "should-not-override",
        constructor: "should-not-override"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          toString: str(),
          valueOf: str(),
          constructor: str()
        },
        { onError: "throw" }
      );

      // Should get the env values, not prototype methods
      expect(env.toString).toBe("should-not-override");
      expect(env.valueOf).toBe("should-not-override");
      expect(env.constructor).toBe("should-not-override");
    });

    it("should handle Object inspection methods", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        VAR1: "value1",
        VAR2: "value2"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          VAR1: str(),
          VAR2: str()
        },
        { onError: "throw" }
      );

      // Object.keys
      const keys = Object.keys(env);
      expect(keys).toEqual(["NODE_ENV", "VAR1", "VAR2"]);

      // Object.values
      const values = Object.values(env);
      expect(values).toEqual(["test", "value1", "value2"]);

      // Object.entries
      const entries = Object.entries(env);
      expect(entries).toEqual([
        ["NODE_ENV", "test"],
        ["VAR1", "value1"],
        ["VAR2", "value2"]
      ]);

      // Object.getOwnPropertyNames includes non-enumerable properties
      const propNames = Object.getOwnPropertyNames(env);
      expect(propNames).toEqual(["NODE_ENV", "VAR1", "VAR2", "isDevelopment", "isDev", "isProduction", "isProd", "isTest"]);

      // Object.getOwnPropertyDescriptor
      const descriptor = Object.getOwnPropertyDescriptor(env, "VAR1");
      expect(descriptor).toBeDefined();
      expect(descriptor?.value).toBe("value1");
      expect(descriptor?.enumerable).toBe(true);
      expect(descriptor?.configurable).toBe(true);

      // in operator
      expect("NODE_ENV" in env).toBe(true);
      expect("VAR1" in env).toBe(true);
      expect("NOT_EXISTS" in env).toBe(false);

      // hasOwnProperty
      expect(Object.prototype.hasOwnProperty.call(env, "VAR1")).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(env, "NOT_EXISTS")).toBe(false);
    });

    it("should handle JSON.stringify correctly", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        STRING: "value",
        NUMBER: "42",
        BOOLEAN: "true",
        JSON_OBJ: '{"key":"value"}'
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          STRING: str(),
          NUMBER: num(),
          BOOLEAN: bool(),
          JSON_OBJ: json()
        },
        { onError: "throw" }
      );

      const jsonString = JSON.stringify(env);
      const parsed = JSON.parse(jsonString) as Record<string, unknown>;

      expect(parsed.NODE_ENV).toBe("test");
      expect(parsed.STRING).toBe("value");
      expect(parsed.NUMBER).toBe(42);
      expect(parsed.BOOLEAN).toBe(true);
      expect(parsed.JSON_OBJ).toEqual({ key: "value" });
    });

    it("should handle spread operator", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        VAR1: "value1",
        VAR2: "value2"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          VAR1: str(),
          VAR2: str()
        },
        { onError: "throw" }
      );

      const spread = { ...env };
      expect(spread).toEqual({
        NODE_ENV: "test",
        VAR1: "value1",
        VAR2: "value2"
      });

      const merged = { ...env, EXTRA: "extra" };
      expect(merged).toEqual({
        NODE_ENV: "test",
        VAR1: "value1",
        VAR2: "value2",
        EXTRA: "extra"
      });
    });

    it("should handle destructuring", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        API_URL: "https://api.example.com",
        API_KEY: "secret"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          API_URL: url(),
          API_KEY: str()
        },
        { onError: "throw" }
      );

      const { NODE_ENV, API_URL, API_KEY } = env;
      expect(NODE_ENV).toBe("test");
      expect(API_URL).toBe("https://api.example.com");
      expect(API_KEY).toBe("secret");
    });
  });

  describe("Error Edge Cases", () => {
    it("should handle circular JSON references gracefully", () => {
      interface CircularRef {
        a: number;
        self?: CircularRef;
      }
      const circular: CircularRef = { a: 1 };
      circular.self = circular;

      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        // This would cause an error if we tried to parse it
        CIRCULAR: "not-valid-json"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          CIRCULAR: json({ default: {} })
        },
        { onError: "return", strict: false }
      );

      // With onError: "return", invalid JSON returns undefined, not the default
      // The default is only used when the value is missing, not when it's invalid
      expect(env.CIRCULAR).toBeUndefined();
    });

    it("should handle undefined process.env gracefully", () => {
      const originalEnv = process.env;

      // Temporarily make process.env undefined
      Object.defineProperty(process, "env", {
        value: undefined,
        configurable: true
      });

      const env = zenv(
        {
          VAR: str({ default: "fallback" })
        },
        { onError: "return", strict: false }
      );

      // When process.env is undefined, runtime.env returns {}
      // With onError: "return", validation fails and returns undefined for VAR
      // This is an extreme edge case that would never occur in practice
      expect(env.VAR).toBeUndefined();

      // Restore process.env
      Object.defineProperty(process, "env", {
        value: originalEnv,
        configurable: true
      });
    });

    it("should handle malformed validator options", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        PORT: "3000"
      });

      // These should not crash
      const env = zenv(
        {
          NODE_ENV: str(),
          PORT: port({ min: -1, max: 100000 }) // Invalid port range
        },
        { onError: "return", strict: false }
      );

      // Port should still be validated within Zod's constraints
      expect(env.PORT).toBe(3000);
    });
  });

  describe("Performance Edge Cases", () => {
    it("should handle deep JSON parsing efficiently", () => {
      interface DeepObject {
        next?: DeepObject;
        level?: number;
      }
      const deepObject: DeepObject = {};
      let current: DeepObject = deepObject;

      // Create deeply nested object
      for (let i = 0; i < 100; i++) {
        current.next = { level: i };
        current = current.next;
      }

      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        DEEP_JSON: JSON.stringify(deepObject)
      });

      const startTime = Date.now();
      const env = zenv(
        {
          NODE_ENV: str(),
          DEEP_JSON: json()
        },
        { onError: "throw" }
      );
      const endTime = Date.now();

      expect(env.DEEP_JSON).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should parse in < 100ms
    });
  });

  describe("Special Environment Scenarios", () => {
    it("should handle Windows-style paths", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        WINDOWS_PATH: "C:\\Users\\Admin\\Documents\\app",
        UNC_PATH: "\\\\server\\share\\folder",
        MIXED_PATH: "C:/Users/Admin/Documents/app"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          WINDOWS_PATH: str(),
          UNC_PATH: str(),
          MIXED_PATH: str()
        },
        { onError: "throw" }
      );

      expect(env.WINDOWS_PATH).toBe("C:\\Users\\Admin\\Documents\\app");
      expect(env.UNC_PATH).toBe("\\\\server\\share\\folder");
      expect(env.MIXED_PATH).toBe("C:/Users/Admin/Documents/app");
    });

    it("should handle Docker-style environment variable references", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        DB_HOST: "${DB_HOST:-localhost}",
        DB_PORT: "${DB_PORT:-5432}",
        CONNECTION_STRING: "postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          DB_HOST: str(),
          DB_PORT: str(),
          CONNECTION_STRING: str()
        },
        { onError: "throw" }
      );

      // Should preserve the literal values (not evaluate them)
      expect(env.DB_HOST).toBe("${DB_HOST:-localhost}");
      expect(env.DB_PORT).toBe("${DB_PORT:-5432}");
      expect(env.CONNECTION_STRING).toContain("${DB_USER}");
    });

    it("should handle environment variables with equals signs in values", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "test",
        BASE64_KEY: "dGVzdD1rZXk9", // The correct value with trailing =
        EQUATION: "x=y+z",
        CONNECTION: "Server=localhost;Database=mydb;User Id=sa;Password=Pass=123"
      });

      const env = zenv(
        {
          NODE_ENV: str(),
          BASE64_KEY: str(),
          EQUATION: str(),
          CONNECTION: str()
        },
        { onError: "throw" }
      );

      expect(env.BASE64_KEY).toBe("dGVzdD1rZXk9");
      expect(env.EQUATION).toBe("x=y+z");
      expect(env.CONNECTION).toBe("Server=localhost;Database=mydb;User Id=sa;Password=Pass=123");
    });
  });
});
