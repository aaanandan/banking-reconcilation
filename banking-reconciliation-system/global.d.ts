// global.d.ts
// Global type definitions for the project

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
