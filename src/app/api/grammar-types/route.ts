import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const grammarTypes = await prisma.grammarType.findMany({
    include: { _count: { select: { sentences: true } } },
    orderBy: [{ level: 'asc' }, { id: 'asc' }],
  });

  return NextResponse.json(grammarTypes);
}
