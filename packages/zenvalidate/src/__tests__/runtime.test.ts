/**
 * @module runtime.test
 * @description Tests for runtime environment detection module
 */
import { runtime } from "../runtime";

describe("Runtime Module", () => {
  describe("Environment Detection", () => {
    it("should detect server environment correctly", () => {
      // In Node.js test environment, we're on server
      expect(runtime.isServer).toBe(true);
      expect(runtime.isClient).toBe(false);
      expect(runtime.isNode).toBe(true);
      expect(runtime.isBrowser).toBe(false);
    });

    it("should provide process.env on server", () => {
      expect(runtime.env).toBeDefined();
      expect(runtime.env).toBe(process.env);
    });

    it("should detect NODE_ENV correctly", () => {
      // We're in test environment
      expect(runtime.nodeEnv).toBe("test");
    });

    it("should detect development environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      // Re-evaluate runtime (need to re-import)
      vi.resetModules();
      const { runtime: devRuntime } = await import("../runtime");

      expect(devRuntime.isDevelopment).toBe(true);
      expect(devRuntime.isProduction).toBe(false);
      expect(devRuntime.isTest).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it("should detect production environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      // Re-evaluate runtime
      vi.resetModules();
      const { runtime: prodRuntime } = await import("../runtime");

      expect(prodRuntime.isProduction).toBe(true);
      expect(prodRuntime.isDevelopment).toBe(false);
      expect(prodRuntime.isTest).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it("should detect test environment", () => {
      expect(runtime.isTest).toBe(true);
      expect(runtime.isDevelopment).toBe(false);
      expect(runtime.isProduction).toBe(false);
    });

    it("should default NODE_ENV to production if not set", async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      // Re-evaluate runtime
      vi.resetModules();
      const { runtime: defaultRuntime } = await import("../runtime");

      expect(defaultRuntime.nodeEnv).toBe("production");
      expect(defaultRuntime.isProduction).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Default Behaviors", () => {
    it("should provide correct default error behavior", () => {
      // On server (Node.js), default is to exit
      expect(runtime.defaultErrorBehavior).toBe("exit");
    });

    it("should provide correct default client access error behavior", () => {
      // In test environment, default is "ignore"
      expect(runtime.defaultClientAccessError).toBe("ignore");
    });

    it("should provide 'warn' in development for client access errors", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      vi.resetModules();
      const { runtime: devRuntime } = await import("../runtime");

      expect(devRuntime.defaultClientAccessError).toBe("warn");

      process.env.NODE_ENV = originalEnv;
    });

    it("should provide 'ignore' in production for client access errors", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      vi.resetModules();
      const { runtime: prodRuntime } = await import("../runtime");

      expect(prodRuntime.defaultClientAccessError).toBe("ignore");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Runtime Constants", () => {
    it("should export all expected properties", () => {
      expect(runtime).toHaveProperty("isServer");
      expect(runtime).toHaveProperty("isClient");
      expect(runtime).toHaveProperty("isNode");
      expect(runtime).toHaveProperty("isBrowser");
      expect(runtime).toHaveProperty("env");
      expect(runtime).toHaveProperty("nodeEnv");
      expect(runtime).toHaveProperty("isDevelopment");
      expect(runtime).toHaveProperty("isProduction");
      expect(runtime).toHaveProperty("isTest");
      expect(runtime).toHaveProperty("defaultErrorBehavior");
      expect(runtime).toHaveProperty("defaultClientAccessError");
    });

    it("should have correct types for all properties", () => {
      expect(typeof runtime.isServer).toBe("boolean");
      expect(typeof runtime.isClient).toBe("boolean");
      expect(typeof runtime.isNode).toBe("boolean");
      expect(typeof runtime.isBrowser).toBe("boolean");
      expect(typeof runtime.env).toBe("object");
      expect(typeof runtime.nodeEnv).toBe("string");
      expect(typeof runtime.isDevelopment).toBe("boolean");
      expect(typeof runtime.isProduction).toBe("boolean");
      expect(typeof runtime.isTest).toBe("boolean");
      expect(typeof runtime.defaultErrorBehavior).toBe("string");
      expect(typeof runtime.defaultClientAccessError).toBe("string");
    });
  });
});
