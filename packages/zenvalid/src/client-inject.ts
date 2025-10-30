/**
 * @module client-inject
 * @description Helper utilities for injecting client-safe environment variables during SSR
 */
import { runtime } from "./runtime";
import type { CleanedEnv, ZenvSpec } from "./types";

// Declare the global for TypeScript
declare global {
  interface Window {
    __ZENV_CLIENT__?: Record<string, unknown>;
  }
}

/**
 * Generates JavaScript code to inject client-safe environment variables into the browser.
 * This should be called on the server during SSR and the result included in a script tag.
 *
 * @param env The parsed environment object returned from zenv()
 * @param clientSafePrefixes Optional array of prefixes that indicate client-safe variables.
 *                          If not provided, uses the prefixes configured in zenv options.
 * @returns JavaScript code as a string, or empty string if on client
 *
 * @example
 * ```ts
 * // Using auto-detected prefixes from zenv configuration
 * const script = getClientEnvScript(env);
 *
 * // Or with explicit prefixes (overrides configured prefixes)
 * const script = getClientEnvScript(env, ["PUBLIC_", "CUSTOM_"]);
 * // Returns: 'window.__ZENV_CLIENT__ = {"PUBLIC_API_URL": "...", ...};'
 * ```
 */
export function getClientEnvScript<T extends ZenvSpec>(env: CleanedEnv<T>, clientSafePrefixes?: string[]): string {
  // Handle client-side hydration: if window.__ZENV_CLIENT__ already exists from SSR,
  // return a script that recreates the same JSON to prevent hydration mismatch
  if (runtime.isClient) {
    // Check if the global was already injected by SSR
    if (typeof window !== "undefined" && window.__ZENV_CLIENT__) {
      // Serialize the existing client env to maintain hydration consistency
      const jsonStr = JSON.stringify(window.__ZENV_CLIENT__);
      // Apply the same escaping as server-side for consistency
      const escapedJson = jsonStr.replace(/<\/script>/gi, (match) => match.replace("/", "\\/"));
      return `window.__ZENV_CLIENT__ = ${escapedJson};`;
    }
    // For client-only renders (no SSR), return empty
    return "";
  }

  // Use provided prefixes, or try to get them from the env object's metadata
  // The __clientSafePrefixes__ property is set by zenv when clientSafePrefixes option is provided
  const prefixes = clientSafePrefixes ?? env.__clientSafePrefixes__ ?? [];

  // Extract client-safe variables
  const clientEnv: Record<string, unknown> = {};

  // Get all enumerable properties from the env object
  const keys = Object.keys(env);

  for (const key of keys) {
    // Check if this variable should be exposed to client
    const isClientSafe = prefixes.length > 0 && prefixes.some((prefix) => key.startsWith(prefix));
    if (isClientSafe) {
      const value = env[key];
      if (value !== undefined) {
        clientEnv[key] = value;
      }
    }
  }

  // Generate script to inject into global scope
  // Escape </script> tags to prevent breaking out of script context
  const jsonStr = JSON.stringify(clientEnv);
  // Replace forward slash in </script> tags with escaped version to prevent script injection
  const escapedJson = jsonStr.replace(/<\/script>/gi, (match) => match.replace("/", "\\/"));
  return `window.__ZENV_CLIENT__ = ${escapedJson};`;
}
