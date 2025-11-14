import { createLogger, format, transports } from "winston";
import path from "path";
import { env } from "./env";

const LOG_DIR = path.resolve(process.cwd(), "../data/logs");

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    }),
    new transports.File({
      filename: path.join(LOG_DIR, "backend.log")
    })
  ]
});

logger.info("Logger initialized", {
  port: env.PORT
});
