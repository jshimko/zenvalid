import { zenv } from "../core";
import { str } from "../validators";
import { createMockEnv, mockProcessEnv } from "./test-utils";

describe("Debug Zenv", () => {
  let envMock: ReturnType<typeof mockProcessEnv>;

  beforeEach(() => {
    envMock = mockProcessEnv(createMockEnv());
  });

  afterEach(() => {
    envMock.restore();
  });

  it("should apply defaults in zenv", () => {
    envMock.restore();
    envMock = mockProcessEnv({
      NODE_ENV: "test"
    });

    console.log("process.env:", process.env);
    console.log("process.env.NODE_ENV:", process.env.NODE_ENV);
    console.log("process.env.LOG_LEVEL:", process.env.LOG_LEVEL);

    const env = zenv(
      {
        NODE_ENV: str(),
        LOG_LEVEL: str({
          default: "info",
          devDefault: "debug",
          testDefault: "error"
        })
      },
      { onError: "throw" }
    );

    console.log("Validated env:", env);
    console.log("env.NODE_ENV:", env.NODE_ENV);
    console.log("env.LOG_LEVEL:", env.LOG_LEVEL);

    expect(env.NODE_ENV).toBe("test");
    expect(env.LOG_LEVEL).toBe("error"); // Should use testDefault
  });
});
