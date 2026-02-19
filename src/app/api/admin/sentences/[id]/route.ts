import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { chinese, grammarTypeId } = await req.json();

  const sentence = await prisma.sentence.update({
    where: { id: Number(id) },
    data: {
      ...(chinese !== undefined && { chinese }),
      ...(grammarTypeId !== undefined && { grammarTypeId }),
    },
  });

  return NextResponse.json(sentence);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  await prisma.practiceRecord.deleteMany({ where: { sentenceId: Number(id) } });
  await prisma.sentence.delete({ where: { id: Number(id) } });

  return NextResponse.json({ success: true });
}
