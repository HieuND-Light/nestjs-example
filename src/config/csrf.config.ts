import { doubleCsrf, DoubleCsrfConfigOptions } from 'csrf-csrf';
import { Request } from 'express';

const options: DoubleCsrfConfigOptions = {
  getSecret: (req) => process.env.CSRF_SECRET!,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'],
  getSessionIdentifier: (req: Request) => req.session.id,
};

const {
  invalidCsrfTokenError,
  generateCsrfToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf(options);

export { generateCsrfToken, validateRequest, doubleCsrfProtection };
