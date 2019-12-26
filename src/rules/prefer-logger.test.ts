import { RuleTester } from "eslint";
import rule from "./prefer-logger";

declare module "eslint" {
  namespace RuleTester {
    interface TestCaseError {
      suggestions?: { messageId: string, output?: string }[]
    }
  }
}

const tester = new RuleTester({ parserOptions: { sourceType: "module", ecmaVersion: 6 } });

tester.run("prefer-logger", rule, {
  valid: [
    { 
      code: `const console = require("my-logger"); console.log("test")`,
      options: [{
        logger: "utils/logger.js",
      }],
    },
  ],
  invalid: [
    {
      code: `console.error("test")`,
      options: [{
        logger: "utils/logger.js",
        base: "src",
      }],
      filename: "src/app/index.js",
      errors: [{
        messageId: "prefer-logger",
        suggestions: [
          {
            messageId: "prefer-logger",
          },
          {
            messageId: "import-logger",
            output: [`import logger from "../../utils/logger.js"`, `console.error("test")`].join("\n")
          }
        ]
      }],
    },
    {
      code: `import logger from "logger"; console.warn("test")`,
      options: [{
        logger: "logger",
      }],
      errors: [{ messageId: "prefer-logger" }],
    },
    {
      code: `console.warn("test");console.warn("test")`,
      options: [{
        logger: "utils/logger.js",
      }],
      errors: [{ messageId: "prefer-logger" }, { messageId: "prefer-logger" }],
    },
    {
      code: `console.error("test")`,
      options: [{
        logger: "logger",
      }],
      errors: [{
        messageId: "prefer-logger",
        suggestions: [
          { messageId: "prefer-logger", output: `logger.error("test")` },
          { messageId: "import-logger", output: [`import logger from "logger"`, `console.error("test")`].join("\n") },
        ]
      }],
    },
  ],
});
