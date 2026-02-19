import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const grammarTypeId = req.nextUrl.searchParams.get('grammarTypeId');

  if (!grammarTypeId) {
    return NextResponse.json({ error: '缺少 grammarTypeId 参数' }, { status: 400 });
  }

  const sentences = await prisma.sentence.findMany({
    where: { grammarTypeId: Number(grammarTypeId) },
    include: { grammarType: true },
  });

  return NextResponse.json(sentences);
}
