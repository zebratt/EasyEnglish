import { NextRequest, NextResponse } from 'next/server';
import { callKimi } from '@/lib/kimi';

const EVALUATE_PROMPT = `你是一位专业的英语教师。用户正在练习英语语法翻译，请评估他们的翻译质量。

目标语法类型：{grammarType}
中文原句：{chinese}
用户翻译：{userTranslation}

请严格按照以下 JSON 格式返回评估结果（不要包含任何其他文字）：
{
  "totalScore": <0-100的整数>,
  "grammarScore": <0-100的整数，语法正确性评分>,
  "semanticScore": <0-100的整数，语义准确性评分>,
  "fluencyScore": <0-100的整数，表达自然度评分>,
  "feedback": "<对用户翻译的详细点评，指出错误并说明如何改正，用中文回答>",
  "referenceSimple": "<简单版参考译文>",
  "referenceMedium": "<中等版参考译文>",
  "referenceComplex": "<复杂版参考译文>"
}`;

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
