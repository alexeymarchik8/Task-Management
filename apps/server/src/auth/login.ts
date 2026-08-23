import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { generateToken } from './jwt.js';

export const loginRouter = Router();

loginRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !password || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Неверный email или пароль' });
    return;
  }

  const token = generateToken(user.id);
  res.status(200).json({ id: user.id, email: user.email, token });
});
