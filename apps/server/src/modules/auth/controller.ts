import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/index.js';
import { hashPassword, comparePassword } from '../../services/passwordService.js';
import { generateToken } from '../../services/tokenService.js';
import * as authRepository from './repository.js';
import type { RegisterBody, LoginBody } from './types.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as RegisterBody;

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

  const hashedPassword = await hashPassword(password);

  try {
    const user = await authRepository.createUser(email, hashedPassword);

    const token = generateToken(user.id);
    res.status(201).json({ id: user.id, email: user.email, token });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'Этот email уже зарегистрирован' });
      return;
    }
    throw err;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginBody;

  const user = email ? await authRepository.findUserByEmail(email) : null;
  if (!user || !password || !(await comparePassword(password, user.password))) {
    res.status(401).json({ error: 'Неверный email или пароль' });
    return;
  }

  const token = generateToken(user.id);
  res.status(200).json({ id: user.id, email: user.email, token });
}
