import { NextRequest, NextResponse } from 'next/server';
import { callKimi } from '@/lib/kimi';

const EVALUATE_PROMPT = `你是一位专业的英语教师。用户正在练习英语语法翻译，请评估他们的翻译质量。

目标语法类型：{grammarType}
中文原句：{chinese}
用户翻译：{userTranslation}

请严格按照以下 JSON 格式返回评估结果（不要包含任何其他文字）：
{
  "totalScore": <0-100的整数，综合评分，综合考虑语法正确性、语义准确性和表达自然度>,
  "feedback": "<使用 Markdown 格式的详细点评，用中文回答。可以使用加粗、列表等格式让内容更清晰>",
  "errors": [
    {
      "original": "<用户翻译中有错误的原文片段，必须是用户翻译中的原始文字>",
      "correction": "<修改后的正确表达>",
      "explanation": "<简短说明错误原因，用中文>"
    }
  ],
  "referenceSimple": "<简单版参考译文>",
  "referenceMedium": "<中等版参考译文>",
  "referenceComplex": "<复杂版参考译文>"
}

errors 数组规则：
- 如果用户翻译完全正确，errors 为空数组 []
- 每个 error 的 original 字段必须是用户翻译中能精确匹配到的原始文字片段
- 尽量定位到最小的错误片段（单词或短语级别），不要把整句话作为一个错误`;

export async function POST(req: NextRequest) {
  const { chinese, userTranslation, grammarType } = await req.json();

  if (!chinese || !userTranslation || !grammarType) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const prompt = EVALUATE_PROMPT.replace('{grammarType}', grammarType)
    .replace('{chinese}', chinese)
    .replace('{userTranslation}', userTranslation);

  try {
    const result = await callKimi([{ role: 'user', content: prompt }]);

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 返回格式异常' }, { status: 500 });
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json({ error: 'AI 评分服务暂时不可用' }, { status: 500 });
  }
}
