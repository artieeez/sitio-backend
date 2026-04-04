import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { redactSensitive } from "../utils/redact-sensitive";

type ErrorBody = { message: string; code?: string };

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();
      if (typeof raw === "string") {
        body = { message: raw, code: httpStatusToCode(status) };
      } else if (typeof raw === "object" && raw !== null) {
        const o = raw as Record<string, unknown>;
        const msg = o.message;
        const message = Array.isArray(msg)
          ? msg.join("; ")
          : typeof msg === "string"
            ? msg
            : "Request error";
        const code =
          typeof o.code === "string" ? o.code : httpStatusToCode(status);
        body = { message, code };
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        redactSensitive({ msg: exception.message, stack: exception.stack }),
      );
    } else {
      this.logger.error("Unhandled non-Error exception");
    }

    res.status(status).json(redactSensitive(body));
  }
}

function httpStatusToCode(status: number): string {
  if (status === 400) {
    return "BAD_REQUEST";
  }
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status === 409) {
    return "CONFLICT";
  }
  if (status === 502) {
    return "BAD_GATEWAY";
  }
  return "HTTP_ERROR";
}
