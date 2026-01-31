import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface LogContext {
  [key: string]: unknown;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(message: string): void;
  debug(context: LogContext, message: string): void;
  info(message: string): void;
  info(context: LogContext, message: string): void;
  warn(message: string): void;
  warn(context: LogContext, message: string): void;
  error(message: string): void;
  error(context: LogContext, message: string): void;
}

class ConsoleLogger implements Logger {
  private logFile?: ReturnType<typeof createWriteStream>;

  constructor(private minLevel: LogLevel = "info") {}

  async enableFileLogging(path: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    this.logFile = createWriteStream(path, { flags: "a" });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatMessage(level: LogLevel, context: LogContext | string, message?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = typeof context === "string" ? {} : context;
    const msg = typeof context === "string" ? context : message || "";

    const entry = {
      timestamp,
      level,
      message: msg,
      ...ctx,
    };

    return JSON.stringify(entry);
  }

  private log(level: LogLevel, context: LogContext | string, message?: string): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, context, message);

    // Write to console
    console.error(formatted);

    // Write to file if enabled
    if (this.logFile) {
      this.logFile.write(`${formatted}\n`);
    }
  }

  debug(contextOrMessage: LogContext | string, message?: string): void {
    this.log("debug", contextOrMessage, message);
  }

  info(contextOrMessage: LogContext | string, message?: string): void {
    this.log("info", contextOrMessage, message);
  }

  warn(contextOrMessage: LogContext | string, message?: string): void {
    this.log("warn", contextOrMessage, message);
  }

  error(contextOrMessage: LogContext | string, message?: string): void {
    this.log("error", contextOrMessage, message);
  }
}

export const logger = new ConsoleLogger((process.env.LOG_LEVEL as LogLevel) || "info");

// Enable file logging if LOG_FILE is set
if (process.env.LOG_FILE) {
  logger.enableFileLogging(process.env.LOG_FILE).catch((err) => {
    console.error("Failed to enable file logging:", err);
  });
}
