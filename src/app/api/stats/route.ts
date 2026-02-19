import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const payload = verifyToken(authHeader.slice(7));

    const grammarTypes = await prisma.grammarType.findMany({
      orderBy: [{ level: 'asc' }, { id: 'asc' }],
    });

    const stats = await Promise.all(
      grammarTypes.map(async (gt) => {
        const records = await prisma.practiceRecord.findMany({
          where: { userId: payload.userId, sentence: { grammarTypeId: gt.id } },
          select: { totalScore: true },
        });

        const totalPracticed = records.length;
        const avgScore = totalPracticed > 0
          ? Math.round(records.reduce((sum, r) => sum + r.totalScore, 0) / totalPracticed)
          : 0;
        const passRate = totalPracticed > 0
          ? Math.round((records.filter((r) => r.totalScore >= 60).length / totalPracticed) * 100)
          : 0;

        return {
          grammarType: gt,
          totalPracticed,
          avgScore,
          passRate,
        };
      }),
    );

    const totalPracticed = stats.reduce((sum, s) => sum + s.totalPracticed, 0);
    const weakPoints = stats
      .filter((s) => s.totalPracticed >= 3 && s.avgScore < 70)
      .sort((a, b) => a.avgScore - b.avgScore);

    return NextResponse.json({ stats, totalPracticed, weakPoints });
  } catch {
    return NextResponse.json({ error: '认证失败' }, { status: 401 });
  }
}
