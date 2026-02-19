import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const payload = verifyToken(authHeader.slice(7));
    const data = await req.json();

    const record = await prisma.practiceRecord.create({
      data: {
        userId: payload.userId,
        sentenceId: data.sentenceId,
        userTranslation: data.userTranslation,
        totalScore: data.totalScore,
        grammarScore: data.grammarScore,
        semanticScore: data.semanticScore,
        fluencyScore: data.fluencyScore,
        feedback: data.feedback,
        referenceSimple: data.referenceSimple,
        referenceMedium: data.referenceMedium,
        referenceComplex: data.referenceComplex,
      },
    });

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: '认证失败' }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const payload = verifyToken(authHeader.slice(7));
    const grammarTypeId = req.nextUrl.searchParams.get('grammarTypeId');

    const where: { userId: number; sentence?: { grammarTypeId: number } } = {
      userId: payload.userId,
    };
    if (grammarTypeId) {
      where.sentence = { grammarTypeId: Number(grammarTypeId) };
    }

    const records = await prisma.practiceRecord.findMany({
      where,
      include: { sentence: { include: { grammarType: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: '认证失败' }, { status: 401 });
  }
}
