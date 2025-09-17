/* Simple leveled logger with timestamps and colorized output (no external deps) */

export type LogLevelName = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevelName, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  gray: "\x1b[90m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function colorize(level: LogLevelName, msg: string): string {
  switch (level) {
    case "debug":
      return `${COLORS.gray}${msg}${COLORS.reset}`;
    case "info":
      return `${COLORS.blue}${msg}${COLORS.reset}`;
    case "warn":
      return `${COLORS.yellow}${msg}${COLORS.reset}`;
    case "error":
      return `${COLORS.red}${msg}${COLORS.reset}`;
  }
}

function ts(): string {
  return new Date().toISOString();
}

function envLevel(): LogLevelName {
  const raw = (process.env.LOG_LEVEL || "info").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") return raw;
  return "info";
}

const currentLevel = envLevel();

function shouldLog(level: LogLevelName): boolean {
  return levelOrder[level] >= levelOrder[currentLevel];
}

function baseLog(level: LogLevelName, ...args: unknown[]): void {
  if (!shouldLog(level)) return;
  const prefix = `[${ts()}] ${level.toUpperCase()}`;
  const message = colorize(level, prefix);
  // Avoid JSON.stringify surprises; rely on console
  switch (level) {
    case "debug":
    case "info":
      console.log(message, ...args);
      break;
    case "warn":
      console.warn(message, ...args);
      break;
    case "error":
      console.error(message, ...args);
      break;
  }
}

export const logger = Object.freeze({
  debug: (...args: unknown[]) => baseLog("debug", ...args),
  info: (...args: unknown[]) => baseLog("info", ...args),
  warn: (...args: unknown[]) => baseLog("warn", ...args),
  error: (...args: unknown[]) => baseLog("error", ...args),
});
