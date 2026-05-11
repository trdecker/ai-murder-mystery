const isDev = process.env.DEBUG_MODE === "true";

export const logger = {
  debug: <T extends readonly unknown[]>(...args: T) => {
    if (isDev) {
      console.log("###### [DEBUG]", ...args);
    }
  },
  error: <T extends readonly unknown[]>(...args: T) => {
    if (isDev) {
      console.error("###### [ERROR]", ...args);
    }
  },
  warn: <T extends readonly unknown[]>(...args: T) => {
    if (isDev) {
      console.warn("###### [WARN]", ...args);
    }
  },
  info: <T extends readonly unknown[]>(...args: T) => {
    if (isDev) {
      console.info("###### [INFO]", ...args);
    }
  },
};
