import { csrfSync } from 'csrf-sync';
import { Request } from 'express';
import createHttpError, { HttpError } from 'http-errors';

const {
  generateToken,
  getTokenFromRequest,
  getTokenFromState,
  storeTokenInState,
  revokeToken,
  csrfSynchronisedProtection,
} = csrfSync({
  getTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string,
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

export { generateToken, csrfSynchronisedProtection };
export const invalidCsrfTokenError: HttpError = createHttpError();
