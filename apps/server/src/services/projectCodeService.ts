import { prisma } from '../db/prisma.js';

const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 8;

export function randomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function generateUniqueProjectCode(
  codeGenerator: () => string = randomCode,
): Promise<string> {
  let code = codeGenerator();
  while (await prisma.project.findUnique({ where: { code } })) {
    code = codeGenerator();
  }
  return code;
}
