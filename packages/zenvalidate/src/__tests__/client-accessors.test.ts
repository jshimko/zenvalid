/**
 * @module client-accessors.test
 * @description Tests for client-side accessor properties (isDevelopment, isProduction, etc.)
 * This specifically tests the fix for the bug where these properties always returned
 * production values on the client.
 */
import { str, zenv } from "../index";
import { runtime } from "../runtime";
import { mockProcessEnv, mockRuntime } from "./test-utils";

describe("Client-side accessor properties", () => {
  let envMock: ReturnType<typeof mockProcessEnv>;

  beforeEach(() => {
    envMock = mockProcessEnv({
      NODE_ENV: "test"
    });
  });

  afterEach(() => {
    envMock.restore();
  });

  describe("when NODE_ENV is not exposed to client", () => {
    it("should use runtime detection for accessor properties in development", async () => {
      // Set up development environment
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "development"
      });

      // Re-import runtime to get fresh detection
      vi.resetModules();
      const { runtime: devRuntime } = await import("../runtime");

      // Create env without exposing NODE_ENV
      const env = zenv(
        {
          API_URL: str({ default: "http://localhost:3000" })
          // NODE_ENV not included, so it won't be exposed to client
        },
        { onError: "throw" }
      );

      // Test server-side accessors work correctly
      const serverMock = mockRuntime("server");
      expect(env.isDevelopment).toBe(true);
      expect(env.isDev).toBe(true);
      expect(env.isProduction).toBe(false);
      expect(env.isProd).toBe(false);
      expect(env.isTest).toBe(false);
      serverMock.restore();

      // Test client-side accessors also work correctly
      const clientMock = mockRuntime("client");
      // Mock the runtime's nodeEnv to return development on client
      vi.spyOn(devRuntime, "nodeEnv", "get").mockReturnValue("development");

      expect(env.isDevelopment).toBe(true);
      expect(env.isDev).toBe(true);
      expect(env.isProduction).toBe(false);
      expect(env.isProd).toBe(false);
      expect(env.isTest).toBe(false);
      clientMock.restore();
    });

    it("should use runtime detection for accessor properties in production", async () => {
      // Set up production environment
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "production"
      });

      // Re-import runtime to get fresh detection
      vi.resetModules();
      const { runtime: prodRuntime } = await import("../runtime");

      // Create env without exposing NODE_ENV
      const env = zenv(
        {
          API_URL: str({ default: "https://api.example.com" })
          // NODE_ENV not included
        },
        { onError: "throw" }
      );

      // Test server-side accessors
      const serverMock = mockRuntime("server");
      expect(env.isDevelopment).toBe(false);
      expect(env.isDev).toBe(false);
      expect(env.isProduction).toBe(true);
      expect(env.isProd).toBe(true);
      expect(env.isTest).toBe(false);
      serverMock.restore();

      // Test client-side accessors
      const clientMock = mockRuntime("client");
      // Mock the runtime's nodeEnv to return production on client
      vi.spyOn(prodRuntime, "nodeEnv", "get").mockReturnValue("production");

      expect(env.isDevelopment).toBe(false);
      expect(env.isDev).toBe(false);
      expect(env.isProduction).toBe(true);
      expect(env.isProd).toBe(true);
      expect(env.isTest).toBe(false);
      clientMock.restore();
    });

    it("should use runtime detection for accessor properties in test", () => {
      // Already in test environment from beforeEach

      // Create env without exposing NODE_ENV
      const env = zenv(
        {
          API_URL: str({ default: "http://test.example.com" })
          // NODE_ENV not included
        },
        { onError: "throw" }
      );

      // Test server-side accessors
      const serverMock = mockRuntime("server");
      expect(env.isDevelopment).toBe(false);
      expect(env.isDev).toBe(false);
      expect(env.isProduction).toBe(false);
      expect(env.isProd).toBe(false);
      expect(env.isTest).toBe(true);
      serverMock.restore();

      // Test client-side accessors
      const clientMock = mockRuntime("client");
      // Mock the runtime's nodeEnv to return test on client
      vi.spyOn(runtime, "nodeEnv", "get").mockReturnValue("test");

      expect(env.isDevelopment).toBe(false);
      expect(env.isDev).toBe(false);
      expect(env.isProduction).toBe(false);
      expect(env.isProd).toBe(false);
      expect(env.isTest).toBe(true);
      clientMock.restore();
    });
  });

  describe("when NODE_ENV is exposed to client", () => {
    it("should use the exposed NODE_ENV value for accessors", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "development"
      });

      // Create env with NODE_ENV exposed
      const env = zenv(
        {
          NODE_ENV: str({
            choices: ["development", "production", "test"],
            client: { expose: true }
          }),
          API_URL: str({ default: "http://localhost:3000" })
        },
        { onError: "throw" }
      );

      // Test server-side
      const serverMock = mockRuntime("server");
      expect(env.NODE_ENV).toBe("development");
      expect(env.isDevelopment).toBe(true);
      expect(env.isProduction).toBe(false);
      serverMock.restore();

      // Test client-side - should use the exposed NODE_ENV
      const clientMock = mockRuntime("client");
      expect(env.NODE_ENV).toBe("development");
      expect(env.isDevelopment).toBe(true);
      expect(env.isProduction).toBe(false);
      clientMock.restore();
    });

    it("should handle NODE_ENV exposed via clientSafePrefixes", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        PUBLIC_NODE_ENV: "production",
        NODE_ENV: "production"
      });

      // Create env with a PUBLIC_ prefixed NODE_ENV
      const env = zenv(
        {
          PUBLIC_NODE_ENV: str({
            choices: ["development", "production", "test"]
          }),
          NODE_ENV: str({
            choices: ["development", "production", "test"]
          })
        },
        {
          onError: "throw",
          clientSafePrefixes: ["PUBLIC_"]
        }
      );

      // Test client-side
      const clientMock = mockRuntime("client");
      // PUBLIC_NODE_ENV should be accessible, NODE_ENV should not
      expect(env.PUBLIC_NODE_ENV).toBe("production");
      expect(env.NODE_ENV).toBeUndefined(); // Not exposed

      // But accessors should still work via runtime detection
      vi.spyOn(runtime, "nodeEnv", "get").mockReturnValue("production");
      expect(env.isProduction).toBe(true);
      expect(env.isDevelopment).toBe(false);
      clientMock.restore();
    });
  });

  describe("edge cases", () => {
    it("should handle missing NODE_ENV gracefully", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        // No NODE_ENV at all
      });

      const env = zenv(
        {
          API_URL: str({ default: "http://localhost:3000" })
        },
        { onError: "throw" }
      );

      // Should default to production
      const serverMock = mockRuntime("server");
      expect(env.isProduction).toBe(true);
      expect(env.isDevelopment).toBe(false);
      serverMock.restore();

      const clientMock = mockRuntime("client");
      // Runtime will also default to production when NODE_ENV is not set
      vi.spyOn(runtime, "nodeEnv", "get").mockReturnValue("production");
      expect(env.isProduction).toBe(true);
      expect(env.isDevelopment).toBe(false);
      clientMock.restore();
    });

    it("should handle non-standard NODE_ENV values", () => {
      envMock.restore();
      envMock = mockProcessEnv({
        NODE_ENV: "staging" // Non-standard value
      });

      const env = zenv(
        {
          NODE_ENV: str({ default: "production" }), // Allow any string
          API_URL: str({ default: "http://localhost:3000" })
        },
        { onError: "throw" }
      );

      // Accessors should treat non-standard values as not matching any environment
      const serverMock = mockRuntime("server");
      expect(env.NODE_ENV).toBe("staging");
      expect(env.isDevelopment).toBe(false);
      expect(env.isProduction).toBe(false);
      expect(env.isTest).toBe(false);
      serverMock.restore();

      const clientMock = mockRuntime("client");
      vi.spyOn(runtime, "nodeEnv", "get").mockReturnValue("staging");
      expect(env.isDevelopment).toBe(false);
      expect(env.isProduction).toBe(false);
      expect(env.isTest).toBe(false);
      clientMock.restore();
    });
  });
});
