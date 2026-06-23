import { Request } from "express";

export interface RequestWithContext extends Request {
  user?: {
    id: number;
    email?: string;
    rol?: string;
  };
  correlationId?: string;
}
