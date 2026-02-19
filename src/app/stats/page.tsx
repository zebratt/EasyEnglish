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
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-xl bg-secondary" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-muted">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Overview cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.totalPracticed}</p>
                    <p className="text-xs text-muted">总练习次数</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-light">
                    <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {data.stats.filter((s) => s.totalPracticed > 0).length}
                    </p>
                    <p className="text-xs text-muted">已练习语法</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-light">
                    <svg className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.weakPoints.length}</p>
                    <p className="text-xs text-muted">薄弱项</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weak points */}
            {data.weakPoints.length > 0 && (
              <div className="rounded-xl border border-error/20 bg-error-light p-5">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <h2 className="text-sm font-semibold text-error">薄弱项（平均分 &lt; 70）</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.weakPoints.map((wp) => (
                    <span
                      key={wp.grammarType.id}
                      className="rounded-full border border-error/20 bg-card px-3 py-1 text-xs font-medium"
                    >
                      {wp.grammarType.name}
                      <span className="ml-1 text-error">{wp.avgScore}分</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed stats */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-5 text-sm font-semibold">各语法类型统计</h2>
              <div className="space-y-4">
                {data.stats.map((s) => (
                  <div key={s.grammarType.id} className="flex items-center gap-4">
                    <div className="w-28 shrink-0">
                      <p className="text-sm font-medium">{s.grammarType.name}</p>
                      <p className="text-xs text-muted">{levelLabel[s.grammarType.level]}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${barColor(s.avgScore)}`}
                          style={{ width: barWidth(s.avgScore) }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      {s.totalPracticed > 0 ? (
                        <span className={`text-sm font-semibold ${scoreColor(s.avgScore)}`}>
                          {s.avgScore}分
                        </span>
                      ) : (
                        <span className="text-xs text-muted">未练习</span>
                      )}
                    </div>
                    <div className="w-14 text-right text-xs text-muted">
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
