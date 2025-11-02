/**
 * @module types/validator-overloads
 * @description Type-level utilities for detecting and handling undefined defaults
 * in environment variable validators. These types enable proper TypeScript inference
 * for optional environment variables without any runtime changes.
 */
import type { z } from "zod/v4";

/**
 * Unique symbol used to brand types that have undefined defaults.
 * This allows us to detect at the type level when a validator was
 * configured with `default: undefined`, `devDefault: undefined`, etc.
 * @internal
 */
declare const UNDEFINED_DEFAULT: unique symbol;

/**
 * Branded type that marks a Zod schema as having an undefined default.
 * This type is intersected with Zod schemas when undefined is detected
 * in default options, allowing the type system to track optionality.
 *
 * @example
 * ```typescript
 * // When a validator has { default: undefined }
 * type Schema = z.ZodDefault<z.ZodString> & UndefinedDefault;
 * ```
 */
export type UndefinedDefault = {
  readonly [UNDEFINED_DEFAULT]: true;
};

/**
 * Type helper that detects if a type has been branded with UndefinedDefault.
 * Returns true if the type includes the undefined default brand, false otherwise.
 *
 * @template T - The type to check for undefined default branding
 *
 * @example
 * ```typescript
 * type HasUndefined1 = HasUndefinedDefault<z.ZodString & UndefinedDefault>; // true
 * type HasUndefined2 = HasUndefinedDefault<z.ZodString>; // false
 * ```
 */
export type HasUndefinedDefault<T> = T extends UndefinedDefault ? true : false;

/**
 * Infers the output type of a Zod schema, adding `| undefined` when the schema
 * has been branded with UndefinedDefault. This is the key type that fixes the
 * inference issue - it conditionally adds undefined to the inferred type.
 *
 * @template T - A Zod schema type
 *
 * @example
 * ```typescript
 * // Schema without undefined default
 * type Required = InferWithOptional<z.ZodString>; // string
 *
 * // Schema with undefined default brand
 * type Optional = InferWithOptional<z.ZodString & UndefinedDefault>; // string | undefined
 * ```
 */
export type InferWithOptional<T extends z.ZodType> = HasUndefinedDefault<T> extends true ? z.infer<T> | undefined : z.infer<T>;

/**
 * Helper type to detect if any of the default options are set to undefined.
 * Used internally by validator overloads to determine when to apply the brand.
 *
 * @template T - The options object to check
 */
export type HasUndefinedInDefaults<T> = T extends { default: undefined }
  ? true
  : T extends { devDefault: undefined }
    ? true
    : T extends { testDefault: undefined }
      ? true
      : false;

/**
 * Conditional type that adds the UndefinedDefault brand when undefined is detected
 * in default options. Used by validator functions to conditionally brand their
 * return types.
 *
 * @template Schema - The Zod schema type to potentially brand
 * @template Options - The options object to check for undefined defaults
 */
export type ConditionallyBrandSchema<Schema extends z.ZodType, Options> =
  HasUndefinedInDefaults<Options> extends true ? Schema & UndefinedDefault : Schema;
