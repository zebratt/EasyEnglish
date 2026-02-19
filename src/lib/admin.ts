import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JwtPayload } from './auth';

export function requireAdmin(req: NextRequest): JwtPayload | NextResponse {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const payload = verifyToken(authHeader.slice(7));
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }
    return payload;
  } catch {
    return NextResponse.json({ error: '认证失败' }, { status: 401 });
  }
}
