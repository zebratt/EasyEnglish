import { NextRequest, NextResponse } from 'next/server';
import { callKimi } from '@/lib/kimi';
import { requireAdmin } from '@/lib/admin';

const GENERATE_PROMPT = `你是一位专业的英语教师，正在为英语语法翻译练习应用准备中文句子。

请根据以下要求生成中文句子，这些句子将被用户翻译成英文来练习特定的语法点。

语法类型：{grammarType}
难度等级：{level}
生成数量：{count}

要求：
1. 每个句子都应该自然地引导用户使用目标语法结构
2. 句子内容贴近日常生活和工作场景
3. 难度要符合等级要求（初级=简单日常、中级=职场社交、高级=学术正式）
4. 句子之间主题尽量多样化

请严格按照以下 JSON 格式返回（不要包含任何其他文字）：
[
  "中文句子1",
  "中文句子2",
  ...
]`;

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { grammarType, level, count = 5 } = await req.json();

  if (!grammarType || !level) {
    return NextResponse.json({ error: '缺少 grammarType 或 level' }, { status: 400 });
  }

  const levelMap: Record<string, string> = {
    BEGINNER: '初级',
    INTERMEDIATE: '中级',
    ADVANCED: '高级',
  };

  const prompt = GENERATE_PROMPT.replace('{grammarType}', grammarType)
    .replace('{level}', levelMap[level] || level)
    .replace('{count}', String(count));

  try {
    const result = await callKimi([{ role: 'user', content: prompt }]);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 返回格式异常' }, { status: 500 });
    }
    const sentences: string[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ sentences });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'AI 生成服务暂时不可用' }, { status: 500 });
  }
}
