import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function getUserId(req: NextRequest): number | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return verifyToken(auth.slice(7)).userId;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nickname: true, role: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { nickname } = await req.json();

  if (typeof nickname !== 'string' || nickname.trim().length > 20) {
    return NextResponse.json({ error: '昵称不能超过20个字符' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { nickname: nickname.trim() || null },
    select: { id: true, email: true, nickname: true, role: true },
  });

  return NextResponse.json(user);
}
