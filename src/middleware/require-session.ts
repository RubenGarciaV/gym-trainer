import { fromNodeHeaders } from 'better-auth/node';
import type { RequestHandler } from 'express';
import { auth } from '../auth.js';

declare global {
  namespace Express {
    interface Locals {
      userId: string;
    }
  }
}

export const requireSession: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      response.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'A valid session is required.',
        },
      });
      return;
    }

    response.locals.userId = session.user.id;
    next();
  } catch (error) {
    next(error);
  }
};
