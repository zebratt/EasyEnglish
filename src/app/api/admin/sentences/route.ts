import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const grammarTypeId = req.nextUrl.searchParams.get('grammarTypeId');
  const page = Number(req.nextUrl.searchParams.get('page') || '1');
  const pageSize = Number(req.nextUrl.searchParams.get('pageSize') || '20');

  const where = grammarTypeId ? { grammarTypeId: Number(grammarTypeId) } : {};

  const [sentences, total] = await Promise.all([
    prisma.sentence.findMany({
      where,
      include: { grammarType: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sentence.count({ where }),
  ]);

  return NextResponse.json({ sentences, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const items: { grammarTypeId: number; chinese: string }[] = Array.isArray(body) ? body : [body];

  const sentences = await Promise.all(
    items.map((item) =>
      prisma.sentence.create({
        data: { grammarTypeId: item.grammarTypeId, chinese: item.chinese },
      }),
    ),
  );

  return NextResponse.json(sentences, { status: 201 });
}
