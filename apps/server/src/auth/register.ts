import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../db/prisma.js';
import { generateToken } from './jwt.js';

export const registerRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;

registerRouter.post('/register', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: 'Некорректный формат email' });
    return;
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    res
      .status(400)
      .json({ error: `Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов` });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = generateToken(user.id);
    res.status(201).json({ id: user.id, email: user.email, token });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'Этот email уже зарегистрирован' });
      return;
    }
    throw err;
  }
});
