import jwt from 'jsonwebtoken';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!);
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
}
