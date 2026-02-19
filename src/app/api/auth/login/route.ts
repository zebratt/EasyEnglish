import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role },
  });
}
