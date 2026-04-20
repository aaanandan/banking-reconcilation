// @types/express/index.d.ts
// Extend Express Request type to include user from JWT

declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      tenantId: string;
      email: string;
      role: string;
    };
  }
}
