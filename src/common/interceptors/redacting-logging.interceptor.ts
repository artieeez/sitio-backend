import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { redactSensitive } from "../utils/redact-sensitive";

/**
 * Structured HTTP logs with passenger CPF and related PII fields redacted (FR-039).
 */
@Injectable()
export class RedactingLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{
      method?: string;
      url?: string;
      body?: unknown;
    }>();
    const method = req.method ?? "?";
    const url = req.url ?? "?";
    const started = Date.now();
    const safeBody = redactSensitive(req.body);

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log({
            msg: "request_complete",
            method,
            url,
            ms: Date.now() - started,
            body: safeBody,
          });
        },
        error: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : JSON.stringify(err);
          this.logger.warn({
            msg: "request_error",
            method,
            url,
            ms: Date.now() - started,
            body: safeBody,
            error: redactSensitive(
              message.includes("cpf") || /\d{11}/.test(message)
                ? "[REDACTED_ERROR]"
                : message,
            ),
          });
        },
      }),
    );
  }
}
