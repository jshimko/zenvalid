/**
 * @module types
 * @description Type definitions for the Zenv package.
 * This file re-exports the simplified types from the types/ directory.
 * The previous 400+ lines of complex interfaces have been replaced with
 * a clean, focused API defined in separate modules.
 */

// Re-export all types from the organized modules
export type {
  // Core option interfaces
  BaseOptions,
  ClientConfig,
  StringOptions,
  NumberOptions,
  BooleanOptions,
  EmailOptions,
  UrlOptions,
  HostOptions,
  PortOptions,
  JsonOptions,
  CustomValidatorOptions,

  // Zenv configuration
  ZenvOptions,
  ZenvSpec,
  ZenvValidator,

  // Type utilities
  InferValidatorType,
  InferZenvType,
  EnvAccessors,
  CleanedEnv
} from "./types/options";

// Re-export type inference utilities if needed by consumers
export type { InferZodType, UniversalEnv, SchemaMetadata } from "./types/inference";

// Re-export validator overload utilities for undefined default handling
export type {
  UndefinedDefault,
  HasUndefinedDefault,
  InferWithOptional,
  HasUndefinedInDefaults,
  ConditionallyBrandSchema
} from "./types/validator-overloads";

// Note: Type guards are not re-exported here as they are runtime functions
// They should be imported from the main module or validators module
