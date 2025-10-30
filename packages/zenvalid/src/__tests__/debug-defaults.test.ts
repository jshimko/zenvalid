import { runtime } from "../runtime";
import { str } from "../validators";
import { createMockEnv, mockProcessEnv } from "./test-utils";

describe("Debug Defaults", () => {
  let envMock: ReturnType<typeof mockProcessEnv>;

  beforeEach(() => {
    envMock = mockProcessEnv(createMockEnv());
  });

  afterEach(() => {
    envMock.restore();
  });

  it("should apply defaults correctly", () => {
    const schema = str({
      default: "info",
      devDefault: "debug",
      testDefault: "error"
    });

    console.log("Runtime NODE_ENV:", runtime.nodeEnv);
    console.log("Runtime isDevelopment:", runtime.isDevelopment);
    console.log("Runtime isTest:", runtime.isTest);

    const result = schema.parse(undefined);
    console.log("Result:", result);

    // In test environment, should use testDefault
    expect(result).toBe("error");
  });

  it("should parse simple schema with default", () => {
    const schema = str({ default: "test-value" });
    const result = schema.parse(undefined);
    expect(result).toBe("test-value");
  });
});
