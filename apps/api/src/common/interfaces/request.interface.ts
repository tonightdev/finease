import { Request } from 'express';

export interface JwtPayload {
  uid: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
