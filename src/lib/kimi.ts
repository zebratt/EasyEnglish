const KIMI_API_URL = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_API_KEY = process.env.KIMI_API_KEY || '';

interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface KimiResponse {
  choices: { message: { content: string } }[];
}

export async function callKimi(messages: KimiMessage[], model = 'moonshot-v1-8k'): Promise<string> {
  const res = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kimi API error: ${res.status} ${res.statusText}`);
  }

  const data: KimiResponse = await res.json();
  return data.choices[0].message.content;
}
