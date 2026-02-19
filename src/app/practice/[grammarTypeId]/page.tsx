'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Markdown from 'react-markdown';
import { Navbar } from '@/components/Navbar';

interface Sentence {
  id: number;
  chinese: string;
  grammarType: { id: number; name: string; nameEn: string; level: string };
}

interface TranslationError {
  original: string;
  correction: string;
  explanation: string;
}

interface Evaluation {
  totalScore: number;
  feedback: string;
  errors?: TranslationError[];
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
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setSentences(shuffled);
      })
      .finally(() => setLoading(false));
  }, [grammarTypeId]);

  const currentSentence = sentences[currentIndex];
  const progress = sentences.length > 0 ? ((currentIndex + 1) / sentences.length) * 100 : 0;

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

  const scoreBg = (score: number) => {
    if (score >= 80) return 'bg-success-light border-success/20';
    if (score >= 60) return 'bg-warning-light border-warning/20';
    return 'bg-error-light border-error/20';
  };

  const highlightErrors = (text: string, errors: TranslationError[]) => {
    if (!errors.length) return text;

    // Build segments: find each error's position in the text
    const segments: { start: number; end: number; errorIndex: number }[] = [];
    let searchFrom = 0;
    for (let i = 0; i < errors.length; i++) {
      const idx = text.toLowerCase().indexOf(errors[i].original.toLowerCase(), searchFrom);
      if (idx !== -1) {
        segments.push({ start: idx, end: idx + errors[i].original.length, errorIndex: i });
        searchFrom = idx + errors[i].original.length;
      }
    }

    if (!segments.length) return text;

    // Sort by position
    segments.sort((a, b) => a.start - b.start);

    const parts: React.ReactNode[] = [];
    let lastEnd = 0;
    for (const seg of segments) {
      if (seg.start > lastEnd) {
        parts.push(text.slice(lastEnd, seg.start));
      }
      parts.push(
        <span
          key={seg.errorIndex}
          className="rounded bg-error/15 px-0.5 text-error underline decoration-wavy decoration-error/60 underline-offset-4"
          title={`${errors[seg.errorIndex].correction} — ${errors[seg.errorIndex].explanation}`}
        >
          {text.slice(seg.start, seg.end)}
        </span>,
      );
      lastEnd = seg.end;
    }
    if (lastEnd < text.length) {
      parts.push(text.slice(lastEnd));
    }
    return parts;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-32 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-48 animate-pulse rounded bg-secondary" />
            </div>
          </div>
          <div className="h-32 animate-pulse rounded-xl bg-secondary" />
          <div className="mt-6 h-24 animate-pulse rounded-xl bg-secondary" />
        </main>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <svg
              className="h-8 w-8 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">该语法类型暂无练习题</p>
          <p className="mt-1 text-sm text-muted">管理员可在后台添加练习句子</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
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
        {/* Header with progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{currentSentence.grammarType.name}</h2>
              <p className="text-xs text-muted">{currentSentence.grammarType.nameEn}</p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-muted">
              {currentIndex + 1} / {sentences.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-1 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Chinese sentence */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <p className="mb-2 text-xs font-medium text-muted">请将以下中文翻译为英文：</p>
          <p className="text-lg leading-relaxed">{currentSentence.chinese}</p>
        </div>

        {/* Translation input */}
        {!evaluation && (
          <div className="space-y-4">
            <textarea
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              placeholder="Type your English translation here..."
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 font-mono text-sm outline-none transition-colors placeholder:text-muted/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Ctrl/Cmd + Enter 提交</p>
              <button
                onClick={handleSubmit}
                disabled={!userTranslation.trim() || evaluating}
                className="cursor-pointer rounded-xl bg-primary px-8 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {evaluating ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    评分中...
                  </span>
                ) : (
                  '提交'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Evaluation result */}
        {evaluation && (
          <div className="space-y-5">
            {/* Total score */}
            <div className={`rounded-xl border p-6 text-center ${scoreBg(evaluation.totalScore)}`}>
              <p className={`text-5xl font-bold ${scoreColor(evaluation.totalScore)}`}>
                {evaluation.totalScore}
              </p>
              <p className="mt-1 text-sm text-muted">总分</p>
            </div>

            {/* Your translation + feedback */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-2 text-sm font-semibold">你的翻译</h3>
              <p className="mb-4 rounded-lg bg-secondary px-4 py-2.5 font-mono text-sm">
                {evaluation.errors && evaluation.errors.length > 0
                  ? highlightErrors(userTranslation, evaluation.errors)
                  : userTranslation}
              </p>

              {/* Error corrections */}
              {evaluation.errors && evaluation.errors.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h3 className="text-sm font-semibold">修改建议</h3>
                  {evaluation.errors.map((err, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-error/20 bg-error-light px-3 py-2"
                    >
                      <div className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <div>
                          <p>
                            <span className="font-mono line-through decoration-error/60">
                              {err.original}
                            </span>
                            <span className="mx-1.5 text-muted">→</span>
                            <span className="font-mono font-medium text-success">
                              {err.correction}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted">{err.explanation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="mb-2 text-sm font-semibold">AI 点评</h3>
              <div className="prose prose-sm max-w-none text-muted prose-strong:text-foreground prose-ul:my-1 prose-li:my-0">
                <Markdown>{evaluation.feedback}</Markdown>
              </div>
            </div>

            {/* Reference translations */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold">参考译文</h3>
              <div className="space-y-3">
                {[
                  {
                    label: '简单',
                    text: evaluation.referenceSimple,
                    color: 'bg-success',
                    bg: 'bg-success-light',
                  },
                  {
                    label: '中等',
                    text: evaluation.referenceMedium,
                    color: 'bg-warning',
                    bg: 'bg-warning-light',
                  },
                  {
                    label: '复杂',
                    text: evaluation.referenceComplex,
                    color: 'bg-error',
                    bg: 'bg-error-light',
                  },
                ].map((ref) => (
                  <div key={ref.label} className={`rounded-lg ${ref.bg} p-3`}>
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${ref.color}`} />
                      <span className="text-xs font-medium text-muted">{ref.label}</span>
                    </div>
                    <p className="font-mono text-sm">{ref.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 cursor-pointer rounded-xl border border-border py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                重新翻译
              </button>
              <button
                onClick={handleNext}
                className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
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
