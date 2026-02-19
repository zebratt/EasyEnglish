'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';

interface GrammarStat {
  grammarType: { id: number; name: string; nameEn: string; level: string };
  totalPracticed: number;
  avgScore: number;
  passRate: number;
}

interface StatsData {
  stats: GrammarStat[];
  totalPracticed: number;
  weakPoints: GrammarStat[];
}

const levelLabel: Record<string, string> = {
  BEGINNER: '初级',
  INTERMEDIATE: '中级',
  ADVANCED: '高级',
};

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('请先登录');
      setLoading(false);
      return;
    }

    fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('获取统计数据失败');
        return res.json();
      })
      .then(setData)
      .catch(() => setError('获取统计数据失败'))
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const barWidth = (score: number) => `${Math.max(score, 4)}%`;

  const barColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">学习统计</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-8">
            {/* 总览 */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5 text-center">
                <p className="text-3xl font-bold text-primary">{data.totalPracticed}</p>
                <p className="mt-1 text-sm text-muted">总练习次数</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 text-center">
                <p className="text-3xl font-bold text-primary">
                  {data.stats.filter((s) => s.totalPracticed > 0).length}
                </p>
                <p className="mt-1 text-sm text-muted">已练习语法类型</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 text-center">
                <p className="text-3xl font-bold text-error">{data.weakPoints.length}</p>
                <p className="mt-1 text-sm text-muted">薄弱项</p>
              </div>
            </div>

            {/* 薄弱项 */}
            {data.weakPoints.length > 0 && (
              <div className="rounded-xl border border-error/20 bg-error/5 p-6">
                <h2 className="mb-3 text-sm font-semibold text-error">薄弱项（平均分 &lt; 70）</h2>
                <div className="flex flex-wrap gap-2">
                  {data.weakPoints.map((wp) => (
                    <span
                      key={wp.grammarType.id}
                      className="rounded-full border border-error/20 bg-card px-3 py-1 text-xs"
                    >
                      {wp.grammarType.name}（{wp.avgScore}分）
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 详细统计 */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold">各语法类型统计</h2>
              <div className="space-y-3">
                {data.stats.map((s) => (
                  <div key={s.grammarType.id} className="flex items-center gap-4">
                    <div className="w-28 shrink-0">
                      <p className="text-sm font-medium">{s.grammarType.name}</p>
                      <p className="text-xs text-muted">{levelLabel[s.grammarType.level]}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className={`h-2 rounded-full transition-all ${barColor(s.avgScore)}`}
                          style={{ width: barWidth(s.avgScore) }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      {s.totalPracticed > 0 ? (
                        <span className={`text-sm font-medium ${scoreColor(s.avgScore)}`}>
                          {s.avgScore}分
                        </span>
                      ) : (
                        <span className="text-xs text-muted">未练习</span>
                      )}
                    </div>
                    <div className="w-16 text-right text-xs text-muted">
                      {s.totalPracticed}次
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
