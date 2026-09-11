import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../lib/auth.ts";

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
type GetSession = (headers: Headers) => Promise<AuthSession | null>;

const getSession: GetSession = (headers) => auth.api.getSession({ headers });

export function createRequireAdmin(resolveSession: GetSession = getSession) {
  return async function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const session = await resolveSession(fromNodeHeaders(req.headers));

      if (!session) {
        res.status(401).json({
          error: {
            code: "UNAUTHENTICATED",
            message: "Authentication is required.",
          },
        });
        return;
      }

      const roles = session.user.role?.split(",").map((role) => role.trim());

      if (!roles?.includes("admin")) {
        res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Administrator access is required.",
          },
        });
        return;
      }

      res.locals.auth = session;
      next();
    } catch (error) {
      console.error("Failed to verify administrator session:", error);
      res.status(500).json({
        error: {
          code: "AUTH_CHECK_FAILED",
          message: "Authentication could not be verified.",
        },
      });
    }
  };
}

export const requireAdmin = createRequireAdmin();
