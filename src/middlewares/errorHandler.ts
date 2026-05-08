import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err.stack);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({ message: isProduction ? 'Internal Server Error' : err.message });
};
