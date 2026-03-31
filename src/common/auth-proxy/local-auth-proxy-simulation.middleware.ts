import { NextFunction, Request, Response } from 'express';
import {
  HEADER_AUTH_USER_ID,
  HEADER_AUTH_USER_NAME,
  HEADER_SHARE_LINK_AUTH,
} from '../constants';

function isTruthy(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').toLowerCase());
}

/**
 * Dev-only proxy simulation:
 * injects staff headers on localhost unless explicitly disabled.
 */
export function localAuthProxySimulation(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const disabled = isTruthy(process.env.DISABLE_LOCAL_AUTH_PROXY_SIMULATION);
  if (disabled) {
    next();
    return;
  }

  if (req.headers[HEADER_SHARE_LINK_AUTH] === 'true') {
    next();
    return;
  }

  const host = req.hostname ?? '';
  const localhostLike = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!localhostLike) {
    next();
    return;
  }

  if (!req.headers[HEADER_AUTH_USER_ID]) {
    req.headers[HEADER_AUTH_USER_ID] = process.env.LOCAL_SIMULATED_USER_ID ?? 'local-staff-1';
  }
  if (!req.headers[HEADER_AUTH_USER_NAME]) {
    req.headers[HEADER_AUTH_USER_NAME] =
      process.env.LOCAL_SIMULATED_USER_NAME ?? 'Local Staff';
  }
  next();
}
