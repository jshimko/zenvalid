/**
 * @module runtime
 * @description Runtime environment detection utilities for the Zenv package.
 * Provides consistent detection of client vs server environments and NODE_ENV values.
 */

/**
 * Runtime environment detection and utilities.
 * This object provides a consistent API for detecting the current runtime environment.
 *
 * @example Basic environment detection
 * ```ts
 * import { runtime } from 'zenvalidate';
 *
 * if (runtime.isServer) {
 *   // Server-only code
 *   console.log('Running on server');
 * } else if (runtime.isClient) {
 *   // Client-only code
 *   console.log('Running in browser');
 * }
 * ```
 *
 * @example NODE_ENV detection
 * ```ts
 * if (runtime.isDevelopment) {
 *   console.log('Development mode');
 * } else if (runtime.isProduction) {
 *   console.log('Production mode');
 * } else if (runtime.isTest) {
 *   console.log('Test mode');
 * }
 * ```
 *
 * @example Environment-specific defaults
 * ```ts
 * const config = {
 *   apiUrl: runtime.isDevelopment
 *     ? 'http://localhost:3000'
 *     : 'https://api.example.com',
 *   errorBehavior: runtime.defaultErrorBehavior
 * };
 * ```
 */
export const runtime = {
  /**
   * Check if running in a server environment (Node.js).
   * True when `window` is undefined and Node.js is detected.
   *
   * @example
   * ```ts
   * if (runtime.isServer) {
   *   const fs = require('fs');
   *   const config = fs.readFileSync('.env');
   * }
   * ```
   */
  get isServer(): boolean {
    // In Node.js, window is undefined and process.versions.node exists
    return typeof window === "undefined" && typeof process !== "undefined";
  },

  /**
   * Check if running in a client environment (browser).
   * True when `window` is defined.
   *
   * @example
   * ```ts
   * if (runtime.isClient) {
   *   window.localStorage.setItem('key', 'value');
   * }
   * ```
   */
  get isClient(): boolean {
    return typeof window !== "undefined";
  },

  /**
   * Check if running in a Node.js environment.
   * More specific than isServer, checks for Node.js specific globals.
   *
   * @example
   * ```ts
   * if (runtime.isNode) {
   *   console.log('Node version:', process.version);
   * }
   * ```
   */
  get isNode(): boolean {
    // If process is defined, we're in Node.js
    return typeof process !== "undefined";
  },

  /**
   * Check if running in a browser environment.
   * Alias for isClient for clarity.
   *
   * @example
   * ```ts
   * if (runtime.isBrowser) {
   *   document.getElementById('app')?.classList.add('loaded');
   * }
   * ```
   */
  get isBrowser(): boolean {
    return typeof window !== "undefined";
  },

  /**
   * Get the current NODE_ENV value.
   * Defaults to 'production' if not set.
   *
   * @example
   * ```ts
   * console.log('Current environment:', runtime.nodeEnv);
   * // Output: 'development', 'production', or 'test'
   *
   * switch (runtime.nodeEnv) {
   *   case 'development':
   *     enableDevTools();
   *     break;
   *   case 'production':
   *     enableOptimizations();
   *     break;
   * }
   * ```
   */
  get nodeEnv(): string {
    if (typeof process !== "undefined") {
      // Handle the edge case where process.env might be undefined
      const env = process.env as NodeJS.ProcessEnv | undefined;
      if (env && typeof env.NODE_ENV === "string") {
        return env.NODE_ENV;
      }
    }
    return "production";
  },

  /**
   * Check if running in development mode.
   *
   * @example
   * ```ts
   * if (runtime.isDevelopment) {
   *   console.log('Debug info:', debugData);
   *   enableHotReload();
   * }
   * ```
   */
  get isDevelopment(): boolean {
    return this.nodeEnv === "development";
  },

  /**
   * Check if running in production mode.
   *
   * @example
   * ```ts
   * if (runtime.isProduction) {
   *   enableCaching();
   *   disableDebugLogging();
   * }
   * ```
   */
  get isProduction(): boolean {
    return this.nodeEnv === "production";
  },

  /**
   * Check if running in test mode.
   *
   * @example
   * ```ts
   * if (runtime.isTest) {
   *   useMockDatabase();
   *   disableNetworkCalls();
   * }
   * ```
   */
  get isTest(): boolean {
    return this.nodeEnv === "test";
  },

  /**
   * Get the environment variables object.
   * Returns process.env on server, injected client env on client.
   *
   * @example
   * ```ts
   * const apiKey = runtime.env.API_KEY;
   * // On server: returns process.env.API_KEY
   * // On client: returns value from window.__ZENV_CLIENT__ if available
   *
   * // Safe access pattern
   * const port = runtime.env.PORT ?? '3000';
   * ```
   */
  get env(): NodeJS.ProcessEnv {
    // On client, check for injected env variables from SSR
    if (this.isClient && typeof window !== "undefined") {
      if (window.__ZENV_CLIENT__) {
        return window.__ZENV_CLIENT__ as NodeJS.ProcessEnv;
      }
    }

    // On server, return process.env
    if (typeof process !== "undefined") {
      return process.env;
    }

    return {};
  },

  /**
   * Get the default error behavior based on environment.
   * Returns 'exit' on server, 'throw' on client.
   *
   * @example
   * ```ts
   * const env = zenv({
   *   API_KEY: str()
   * }, {
   *   onError: runtime.defaultErrorBehavior
   *   // Server: process.exit(1) on error
   *   // Client: throws exception on error
   * });
   * ```
   */
  get defaultErrorBehavior(): "exit" | "throw" {
    return this.isNode ? "exit" : "throw";
  },

  /**
   * Get the default client access error behavior based on environment.
   * Returns 'warn' in development, 'ignore' in production.
   *
   * @example
   * ```ts
   * const env = zenv({
   *   SECRET_KEY: str()
   * }, {
   *   onClientAccessError: runtime.defaultClientAccessError
   *   // Development: console.warn on client access
   *   // Production: silently returns undefined
   * });
   * ```
   */
  get defaultClientAccessError(): "warn" | "ignore" {
    return this.isDevelopment ? "warn" : "ignore";
  }
} as const;
