'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

interface Sentence {
  id: number;
  chinese: string;
  grammarType: { id: number; name: string; nameEn: string; level: string };
}

interface Evaluation {
  totalScore: number;
  grammarScore: number;
  semanticScore: number;
  fluencyScore: number;
  feedback: string;
  referenceSimple: string;
  referenceMedium: string;
  referenceComplex: string;
}

export default function PracticePage({ params }: { params: Promise<{ grammarTypeId: string }> }) {
  const { grammarTypeId } = use(params);
  const router = useRouter();
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userTranslation, setUserTranslation] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    fetch(`/api/sentences?grammarTypeId=${grammarTypeId}`)
      .then((res) => res.json())
      .then((data) => {
        // 随机打乱顺序
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setSentences(shuffled);
      })
      .finally(() => setLoading(false));
  }, [grammarTypeId]);

  const currentSentence = sentences[currentIndex];

  const handleSubmit = async () => {
    if (!userTranslation.trim() || !currentSentence) return;
    setEvaluating(true);

    try {
      const res = await fetch('/api/practice/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chinese: currentSentence.chinese,
          userTranslation,
          grammarType: currentSentence.grammarType.name,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEvaluation(data);
        // 保存练习记录
        const token = localStorage.getItem('token');
        if (token) {
          fetch('/api/practice/records', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sentenceId: currentSentence.id, userTranslation, ...data }),
          });
        }
      }
    } catch {
      alert('评分服务暂时不可用，请稍后重试');
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    setEvaluation(null);
    setUserTranslation('');
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleRetry = () => {
    setEvaluation(null);
    setUserTranslation('');
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-muted">该语法类型暂无练习题</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm text-white hover:bg-primary-hover"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* 进度和语法信息 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{currentSentence.grammarType.name}</h2>
            <p className="text-xs text-muted">{currentSentence.grammarType.nameEn}</p>
          </div>
          <span className="text-sm text-muted">
            {currentIndex + 1} / {sentences.length}
          </span>
        </div>

        {/* 中文句子 */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <p className="mb-2 text-xs font-medium text-muted">请将以下中文翻译为英文：</p>
          <p className="text-lg leading-relaxed">{currentSentence.chinese}</p>
        </div>

        {/* 翻译输入 */}
        {!evaluation && (
          <div className="space-y-4">
            <textarea
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              placeholder="输入你的英文翻译..."
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Ctrl/Cmd + Enter 提交</p>
              <button
                onClick={handleSubmit}
                disabled={!userTranslation.trim() || evaluating}
                className="rounded-lg bg-primary px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {evaluating ? '评分中...' : '提交'}
              </button>
            </div>
          </div>
        )}

        {/* 评分结果 */}
        {evaluation && (
          <div className="space-y-6">
            {/* 总分 */}
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className={`text-5xl font-bold ${scoreColor(evaluation.totalScore)}`}>
                {evaluation.totalScore}
              </p>
              <p className="mt-1 text-sm text-muted">总分</p>
              <div className="mt-4 flex justify-center gap-8">
                {[
                  { label: '语法正确性', score: evaluation.grammarScore },
                  { label: '语义准确性', score: evaluation.semanticScore },
                  { label: '表达自然度', score: evaluation.fluencyScore },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className={`text-xl font-semibold ${scoreColor(item.score)}`}>
                      {item.score}
                    </p>
                    <p className="text-xs text-muted">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 你的翻译 + 反馈 */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-2 text-sm font-medium">你的翻译</h3>
              <p className="mb-4 rounded-lg bg-secondary px-4 py-2 text-sm">{userTranslation}</p>
              <h3 className="mb-2 text-sm font-medium">AI 点评</h3>
              <p className="text-sm leading-relaxed text-muted">{evaluation.feedback}</p>
            </div>

            {/* 参考译文 */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-medium">参考译文</h3>
              <div className="space-y-3">
                {[
                  { label: '简单', text: evaluation.referenceSimple, dot: 'bg-success' },
                  { label: '中等', text: evaluation.referenceMedium, dot: 'bg-warning' },
                  { label: '复杂', text: evaluation.referenceComplex, dot: 'bg-error' },
                ].map((ref) => (
                  <div key={ref.label} className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ref.dot}`} />
                    <div>
                      <span className="text-xs text-muted">{ref.label}</span>
                      <p className="text-sm">{ref.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                重新翻译
              </button>
              <button
                onClick={handleNext}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                下一题
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
