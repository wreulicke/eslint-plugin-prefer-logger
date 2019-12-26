# eslint-plugin-prefer-logger

## Usage 

Example **.eslintrc.js**

```js
// eslintrc
module.exports = {
    "parserOptions": {
        "sourceType": "module",
    },
    "rules": {
        "prefer-logger/prefer-logger": ["error", {
            "logger": "src/utils/logger.js",
        }]
    }
}
```

## prefer-logger/prefer-logger

> Restrict console.log and Suggest logger

### 📖 Rule Details

When use method of `console` object, then it will be replaced to logger.

Examples of :-1: **incorrect** code for this rule:

```js
console.log("test")
console.info("test")
console.warn("test")
console.error("test")
```

Examples of :+1: **correct** code for this rule:

```js
import logger from "../util/logger.js"
logger.log("test")
logger.info("test")
logger.warn("test")
logger.error("test")
```

### Options

```json
{
    "rules": {
        "prefer-logger/prefer-logger": ["error", 
            {
                "loggerName": "logger",
                "logger": "util/logger.js",
                "base": "src"
            }
        ]
    }
}
```



## LICENSE

MIT
