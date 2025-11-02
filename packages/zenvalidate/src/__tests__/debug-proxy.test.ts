import { zenv } from "../core";
import { str } from "../validators";
import { mockProcessEnv } from "./test-utils";

describe("Debug Proxy", () => {
  let envMock: ReturnType<typeof mockProcessEnv>;

  beforeEach(() => {
    envMock = mockProcessEnv({});
  });

  afterEach(() => {
    envMock.restore();
  });

  it("should handle missing env var with default", () => {
    envMock.restore();
    envMock = mockProcessEnv({
      NODE_ENV: "test"
    });

    const env = zenv(
      {
        NODE_ENV: str(),
        MISSING_WITH_DEFAULT: str({ default: "default-value" })
      },
      { onError: "throw", strict: false }
    );

    console.log("Keys in env:", Object.keys(env));
    console.log("env.MISSING_WITH_DEFAULT:", env.MISSING_WITH_DEFAULT);

    expect(env.MISSING_WITH_DEFAULT).toBe("default-value");
  });
});
