import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, nickname } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashed, nickname: nickname || null },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role },
  });
}
