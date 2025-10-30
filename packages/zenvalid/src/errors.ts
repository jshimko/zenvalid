/**
 * @module errors
 * @description Custom error classes for zenv validation.
 * These errors provide detailed information about validation failures
 * and missing environment variables.
 */
import type { z } from "zod/v4";

/**
 * General zenv validation error.
 * Thrown when environment variable validation fails.
 *
 * @augments Error
 *
 * @example Basic usage
 * ```typescript
 * try {
 *   const env = zenv({
 *     PORT: num()
 *   }, { onError: 'throw' });
 * } catch (error) {
 *   if (error instanceof ZenvError) {
 *     console.error('Validation failed:', error.message);
 *     console.error('Zod errors:', error.zodErrors);
 *   }
 * }
 * ```
 *
 * @example Accessing detailed validation errors
 * ```typescript
 * try {
 *   const env = zenv({
 *     PORT: num(),
 *     URL: url()
 *   }, { onError: 'throw' });
 * } catch (error) {
 *   if (error instanceof ZenvError && error.zodErrors) {
 *     error.zodErrors.forEach(zodError => {
 *       zodError.issues.forEach(issue => {
 *         console.error(`${issue.path.join('.')}: ${issue.message}`);
 *       });
 *     });
 *   }
 * }
 * ```
 *
 * @example Custom error handling
 * ```typescript
 * const env = zenv({
 *   PORT: num()
 * }, {
 *   onError: 'throw',
 *   reporter: (errors) => {
 *     throw new ZenvError('Custom validation failed', errors);
 *   }
 * });
 * ```
 */
export class ZenvError extends Error {
  /**
   * Creates a new ZenvError instance.
   *
   * @param message - Error message describing the validation failure
   * @param zodErrors - Optional array of Zod validation errors for detailed information
   */
  constructor(
    message: string,
    public zodErrors?: z.ZodError[]
  ) {
    super(message);
    this.name = "ZenvError";
  }
}

/**
 * Error for missing required environment variables.
 * Extends ReferenceError to indicate a missing reference.
 *
 * @augments ReferenceError
 *
 * @example Basic usage
 * ```typescript
 * if (!process.env.REQUIRED_VAR) {
 *   throw new ZenvMissingError('REQUIRED_VAR is not defined');
 * }
 * ```
 *
 * @example Default message
 * ```typescript
 * // Throws with default message
 * throw new ZenvMissingError();
 * // Error: Missing required environment variables
 * ```
 *
 * @example In validation context
 * ```typescript
 * const env = zenv({
 *   DATABASE_URL: str() // Required, no default
 * }, {
 *   reporter: (errors) => {
 *     const missingVars = errors.flatMap(e =>
 *       e.issues
 *         .filter(i => i.code === 'invalid_type' && i.received === 'undefined')
 *         .map(i => i.path.join('.'))
 *     );
 *     if (missingVars.length > 0) {
 *       throw new ZenvMissingError(`Missing: ${missingVars.join(', ')}`);
 *     }
 *   }
 * });
 * ```
 *
 * @throws {ReferenceError} Always throws when instantiated
 */
export class ZenvMissingError extends ReferenceError {
  /**
   * Creates a new ZenvMissingError instance.
   *
   * @param message - Optional custom error message. Defaults to "Missing required environment variables"
   */
  constructor(message?: string) {
    super(message ?? "Missing required environment variables");
    this.name = "ZenvMissingError";
  }
}
