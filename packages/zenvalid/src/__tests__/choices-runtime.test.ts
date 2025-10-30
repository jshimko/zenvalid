/**
 * Runtime tests for choices type safety.
 * These tests verify that choices work correctly at runtime
 * and that TypeScript properly constrains the types.
 */
import type { z } from "zod/v4";

import { num, str, zenv } from "../index";

describe("Choices runtime behavior", () => {
  describe("str() with choices", () => {
    it("should validate choices correctly WITHOUT as const", () => {
      const validator = str({
        choices: ["development", "test", "production"], // No as const!
        default: "development"
      });

      // Valid values should pass
      expect(validator.parse("development")).toBe("development");
      expect(validator.parse("test")).toBe("test");
      expect(validator.parse("production")).toBe("production");

      // Invalid values should throw
      expect(() => validator.parse("invalid")).toThrow();

      // Default should work
      expect(validator.parse(undefined)).toBe("development");
    });

    it("should validate choices correctly WITH as const", () => {
      const validator = str({
        choices: ["development", "test", "production"] as const,
        default: "development"
      });

      // Valid values should pass
      expect(validator.parse("development")).toBe("development");
      expect(validator.parse("test")).toBe("test");
      expect(validator.parse("production")).toBe("production");

      // Invalid values should throw
      expect(() => validator.parse("invalid")).toThrow();

      // Default should work
      expect(validator.parse(undefined)).toBe("development");
    });

    it("should infer correct TypeScript types", () => {
      const _validator = str({
        choices: ["a", "b", "c"] as const
      });

      type Result = z.infer<typeof _validator>;

      // This is a compile-time check - if it compiles, the type is correct
      const value: Result = "a"; // Should be valid
      expect(value).toBe("a");
    });
  });

  describe("num() with choices", () => {
    it("should validate number choices correctly", () => {
      const validator = num({
        choices: [1, 2, 3] as const,
        default: 2
      });

      // Valid values should pass
      expect(validator.parse("1")).toBe(1);
      expect(validator.parse("2")).toBe(2);
      expect(validator.parse("3")).toBe(3);

      // Invalid values should throw
      expect(() => validator.parse("4")).toThrow();

      // Default should work
      expect(validator.parse(undefined)).toBe(2);
    });

    it("should coerce strings to numbers", () => {
      const validator = num({
        choices: [10, 20, 30] as const
      });

      expect(validator.parse("10")).toBe(10);
      expect(validator.parse("20")).toBe(20);
      expect(validator.parse("30")).toBe(30);
    });
  });

  describe("zenv() with choices", () => {
    it("should work with environment variables", () => {
      const env = zenv(
        {
          NODE_ENV: str({
            choices: ["development", "test", "production"] as const,
            default: "development"
          }),
          WORKERS: num({
            choices: [1, 2, 4, 8] as const,
            default: 4
          })
        },
        {
          env: {
            NODE_ENV: "production",
            WORKERS: "8"
          }
        }
      );

      expect(env.NODE_ENV).toBe("production");
      expect(env.WORKERS).toBe(8);
    });

    it("should throw for invalid choice values", () => {
      expect(() =>
        zenv(
          {
            LOG_LEVEL: str({
              choices: ["debug", "info", "warn", "error"] as const
            })
          },
          {
            env: {
              LOG_LEVEL: "verbose" // Invalid choice
            }
          }
        )
      ).toThrow();
    });
  });

  describe("Backward compatibility", () => {
    it("should work without choices", () => {
      const strValidator = str({
        default: "any string"
      });

      const numValidator = num({
        default: 999
      });

      expect(strValidator.parse("foo")).toBe("foo");
      expect(strValidator.parse(undefined)).toBe("any string");

      expect(numValidator.parse("123")).toBe(123);
      expect(numValidator.parse(undefined)).toBe(999);
    });
  });
});
