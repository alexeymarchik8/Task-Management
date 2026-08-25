import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../db/prisma.js';
import { generateUniqueProjectCode } from './projectCodeService.js';

describe('generateUniqueProjectCode', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('generates an 8-character alphanumeric code', async () => {
    const code = await generateUniqueProjectCode();
    expect(code).toMatch(/^[A-Za-z0-9]{8}$/);
  });

  it('regenerates the code when the first candidate collides with an existing project', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hashed' },
    });
    const existingCode = 'AAAAAAAA';
    await prisma.project.create({
      data: { name: 'Existing', code: existingCode, ownerId: user.id },
    });

    const candidates = [existingCode, 'BBBBBBBB'];
    let call = 0;
    const codeGenerator = () => candidates[call++];

    const code = await generateUniqueProjectCode(codeGenerator);

    expect(code).toBe('BBBBBBBB');
    expect(call).toBe(2);
  });
});
